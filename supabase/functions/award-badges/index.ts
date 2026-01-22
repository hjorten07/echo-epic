import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's JWT to get their identity
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the authenticated user
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for badge operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's total ratings
    const { count: totalRatings } = await adminClient
      .from('ratings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get user's ratings for average calculation
    const { data: ratings } = await adminClient
      .from('ratings')
      .select('rating')
      .eq('user_id', user.id);

    const avgRating = ratings && ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    // Get all badges
    const { data: allBadges } = await adminClient
      .from('badges')
      .select('*');

    // Get user's current badges
    const { data: userBadges } = await adminClient
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', user.id);

    const earnedBadgeIds = new Set(userBadges?.map((ub) => ub.badge_id) || []);
    const newBadges: string[] = [];

    for (const badge of allBadges || []) {
      if (earnedBadgeIds.has(badge.id)) continue;

      let shouldAward = false;

      if (badge.category === 'milestone' && badge.threshold) {
        shouldAward = (totalRatings || 0) >= badge.threshold;
      } else if (badge.category === 'behavior') {
        if (badge.name === 'Song Critic' && avgRating < 3 && (totalRatings || 0) >= 10) {
          shouldAward = true;
        } else if (badge.name === 'Balanced Listener' && avgRating >= 4 && avgRating <= 6 && (totalRatings || 0) >= 10) {
          shouldAward = true;
        } else if (badge.name === 'Music Lover' && avgRating >= 7 && avgRating <= 8 && (totalRatings || 0) >= 10) {
          shouldAward = true;
        } else if (badge.name === 'Easy to Please' && avgRating > 9 && (totalRatings || 0) >= 10) {
          shouldAward = true;
        }
      }

      if (shouldAward) {
        const { error } = await adminClient
          .from('user_badges')
          .insert({ user_id: user.id, badge_id: badge.id });

        if (!error) {
          newBadges.push(badge.name);

          // Create notification
          await adminClient.from('notifications').insert({
            user_id: user.id,
            type: 'badge',
            title: 'New Badge Earned!',
            message: `You earned the "${badge.name}" badge: ${badge.description}`,
          });
        }
      }
    }

    console.log(`Checked badges for user ${user.id}. New badges: ${newBadges.join(', ') || 'none'}`);

    return new Response(
      JSON.stringify({ success: true, newBadges }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error awarding badges:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
