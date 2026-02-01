export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          threshold: number | null
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          threshold?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          threshold?: number | null
        }
        Relationships: []
      }
      banned_words: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          word: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          word: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          word?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          item_id: string
          item_type: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_artists: {
        Row: {
          bio: string | null
          country: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          name: string
          tags: string[] | null
          type: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          name: string
          tags?: string[] | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          name?: string
          tags?: string[] | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_artists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_requests: {
        Row: {
          created_at: string
          id: string
          requester_id: string
          status: string
          target_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          target_id: string
        }
        Update: {
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_requests_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_chat: {
        Row: {
          created_at: string
          id: string
          lobby_id: string
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lobby_id: string
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lobby_id?: string
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_chat_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "game_lobbies"
            referencedColumns: ["id"]
          },
        ]
      }
      game_lobbies: {
        Row: {
          code: string
          created_at: string
          current_round: number
          game_type: string
          host_id: string
          id: string
          is_private: boolean
          max_rounds: number
          round_end_at: string | null
          status: string
          theme: string | null
        }
        Insert: {
          code: string
          created_at?: string
          current_round?: number
          game_type?: string
          host_id: string
          id?: string
          is_private?: boolean
          max_rounds?: number
          round_end_at?: string | null
          status?: string
          theme?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          current_round?: number
          game_type?: string
          host_id?: string
          id?: string
          is_private?: boolean
          max_rounds?: number
          round_end_at?: string | null
          status?: string
          theme?: string | null
        }
        Relationships: []
      }
      game_players: {
        Row: {
          id: string
          is_imposter: boolean | null
          is_ready: boolean
          joined_at: string
          lobby_id: string
          score: number
          user_id: string
          wins: number
        }
        Insert: {
          id?: string
          is_imposter?: boolean | null
          is_ready?: boolean
          joined_at?: string
          lobby_id: string
          score?: number
          user_id: string
          wins?: number
        }
        Update: {
          id?: string
          is_imposter?: boolean | null
          is_ready?: boolean
          joined_at?: string
          lobby_id?: string
          score?: number
          user_id?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_players_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "game_lobbies"
            referencedColumns: ["id"]
          },
        ]
      }
      game_session_ratings: {
        Row: {
          created_at: string
          game_type: string
          id: string
          lobby_id: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          game_type?: string
          id?: string
          lobby_id: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          game_type?: string
          id?: string
          lobby_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_session_ratings_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "game_lobbies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_session_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_submissions: {
        Row: {
          id: string
          lobby_id: string
          player_id: string
          round: number
          song_artist: string | null
          song_id: string
          song_image: string | null
          song_name: string
          submitted_at: string
        }
        Insert: {
          id?: string
          lobby_id: string
          player_id: string
          round: number
          song_artist?: string | null
          song_id: string
          song_image?: string | null
          song_name: string
          submitted_at?: string
        }
        Update: {
          id?: string
          lobby_id?: string
          player_id?: string
          round?: number
          song_artist?: string | null
          song_id?: string
          song_image?: string | null
          song_name?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_submissions_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "game_lobbies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_submissions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "game_players"
            referencedColumns: ["id"]
          },
        ]
      }
      game_themes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      game_votes: {
        Row: {
          created_at: string
          id: string
          lobby_id: string
          points: number
          round: number
          submission_id: string
          voter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lobby_id: string
          points: number
          round: number
          submission_id: string
          voter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lobby_id?: string
          points?: number
          round?: number
          submission_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_votes_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "game_lobbies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_votes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "game_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "game_players"
            referencedColumns: ["id"]
          },
        ]
      }
      hot_take_replies: {
        Row: {
          content: string
          created_at: string
          hot_take_id: string
          id: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          hot_take_id: string
          id?: string
          parent_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          hot_take_id?: string
          id?: string
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hot_take_replies_hot_take_id_fkey"
            columns: ["hot_take_id"]
            isOneToOne: false
            referencedRelation: "hot_takes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hot_take_replies_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "hot_take_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hot_take_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hot_takes: {
        Row: {
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hot_takes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          deleted_by_sender: boolean | null
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          deleted_by_sender?: boolean | null
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by_sender?: boolean | null
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          read: boolean
          related_item_id: string | null
          related_item_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          related_item_id?: string | null
          related_item_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          related_item_id?: string | null
          related_item_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          global_avg_rating: number
          id: string
          min_ratings_for_ranking: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          global_avg_rating?: number
          id?: string
          min_ratings_for_ranking?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          global_avg_rating?: number
          id?: string
          min_ratings_for_ranking?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      playlist_songs: {
        Row: {
          added_at: string
          id: string
          playlist_id: string
          position: number
          song_artist: string | null
          song_id: string
          song_image: string | null
          song_name: string
        }
        Insert: {
          added_at?: string
          id?: string
          playlist_id: string
          position?: number
          song_artist?: string | null
          song_id: string
          song_image?: string | null
          song_name: string
        }
        Update: {
          added_at?: string
          id?: string
          playlist_id?: string
          position?: number
          song_artist?: string | null
          song_id?: string
          song_image?: string | null
          song_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_songs_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          cover_image: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          game_wins: number | null
          id: string
          imposter_catches: number | null
          imposter_wins: number | null
          is_private: boolean | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          game_wins?: number | null
          id: string
          imposter_catches?: number | null
          imposter_wins?: number | null
          is_private?: boolean | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          game_wins?: number | null
          id?: string
          imposter_catches?: number | null
          imposter_wins?: number | null
          is_private?: boolean | null
          username?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_image: string | null
          item_name: string
          item_subtitle: string | null
          item_type: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_image?: string | null
          item_name: string
          item_subtitle?: string | null
          item_type: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_image?: string | null
          item_name?: string
          item_subtitle?: string | null
          item_type?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          reason: string
          reported_comment_id: string | null
          reported_user_id: string | null
          reporter_id: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reason: string
          reported_comment_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reason?: string
          reported_comment_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_comment_id_fkey"
            columns: ["reported_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_stats: {
        Row: {
          created_at: string
          id: string
          new_users: number
          page_views: number
          stat_date: string
          total_ratings: number
          unique_visitors: number
        }
        Insert: {
          created_at?: string
          id?: string
          new_users?: number
          page_views?: number
          stat_date: string
          total_ratings?: number
          unique_visitors?: number
        }
        Update: {
          created_at?: string
          id?: string
          new_users?: number
          page_views?: number
          stat_date?: string
          total_ratings?: number
          unique_visitors?: number
        }
        Relationships: []
      }
      suggestions: {
        Row: {
          admin_notes: string | null
          content: string
          created_at: string
          id: string
          resolved_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          content: string
          created_at?: string
          id?: string
          resolved_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          content?: string
          created_at?: string
          id?: string
          resolved_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          display_order: number | null
          displayed: boolean
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          display_order?: number | null
          displayed?: boolean
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          display_order?: number | null
          displayed?: boolean
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wall_post_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string
          wall_post_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id: string
          wall_post_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_id?: string
          wall_post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wall_post_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wall_post_replies_wall_post_id_fkey"
            columns: ["wall_post_id"]
            isOneToOne: false
            referencedRelation: "wall_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      wall_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wall_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      item_ratings: {
        Row: {
          avg_rating: number | null
          item_id: string | null
          item_image: string | null
          item_name: string | null
          item_subtitle: string | null
          item_type: string | null
          total_ratings: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      are_mutual_followers: {
        Args: { user1_id: string; user2_id: string }
        Returns: boolean
      }
      can_view_profile: { Args: { target_user_id: string }; Returns: boolean }
      get_public_stats: { Args: never; Returns: Json }
      get_similar_users: {
        Args: { limit_count?: number; target_user_id: string }
        Returns: {
          avatar_url: string
          similarity: number
          user_id: string
          username: string
        }[]
      }
      get_taste_similarity: {
        Args: { user1_id: string; user2_id: string }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
      is_following: { Args: { target_user_id: string }; Returns: boolean }
      validate_message: { Args: { message_text: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
