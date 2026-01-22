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

    // Use service role client for streak and badge operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split('T')[0];

    // Get current streak
    const { data: streak } = await adminClient
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    let newStreak = 1;
    let newLongest = 1;

    if (!streak) {
      // Create new streak
      await adminClient.from('user_streaks').insert({
        user_id: user.id,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today,
      });
    } else if (streak.last_activity_date !== today) {
      const lastDate = new Date(streak.last_activity_date);
      const todayDate = new Date(today);
      const diffDays = Math.floor(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        newStreak = streak.current_streak + 1;
      }

      newLongest = Math.max(streak.longest_streak, newStreak);

      await adminClient
        .from('user_streaks')
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      // Check for streak badges
      const { data: streakBadges } = await adminClient
        .from('badges')
        .select('*')
        .eq('category', 'streak');

      const { data: userBadges } = await adminClient
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', user.id);

      const earnedBadgeIds = new Set(userBadges?.map((ub) => ub.badge_id) || []);

      for (const badge of streakBadges || []) {
        if (!earnedBadgeIds.has(badge.id) && badge.threshold && newLongest >= badge.threshold) {
          await adminClient
            .from('user_badges')
            .insert({ user_id: user.id, badge_id: badge.id });

          await adminClient.from('notifications').insert({
            user_id: user.id,
            type: 'badge',
            title: 'Streak Badge Earned!',
            message: `You earned the "${badge.name}" badge for maintaining a ${badge.threshold}-day streak!`,
          });
        }
      }
    }

    console.log(`Updated streak for user ${user.id}: current=${newStreak}, longest=${newLongest}`);

    return new Response(
      JSON.stringify({ success: true, currentStreak: newStreak, longestStreak: newLongest }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating streak:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
