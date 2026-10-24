
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "activity_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"entity_id": string,"entity_type": Database["public"]['Enums']["entity_type"],"id": number,"metadata": NonNullable<Json>,"org_id": string,"project_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"entity_id": string,"entity_type": Database["public"]['Enums']["entity_type"],"id"?: never,"metadata"?: NonNullable<Json>,"org_id": string,"project_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"entity_id"?: string,"entity_type"?: Database["public"]['Enums']["entity_type"],"id"?: never,"metadata"?: NonNullable<Json>,"org_id"?: string,"project_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "activity_log_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_log_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_log_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"comments": {
                  Row: {
                    "author_id": string | null,"body": string,"created_at": string,"entity_id": string,"entity_type": Database["public"]['Enums']["entity_type"],"id": string,"org_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body": string,"created_at"?: string,"entity_id": string,"entity_type": Database["public"]['Enums']["entity_type"],"id"?: string,"org_id": string,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"created_at"?: string,"entity_id"?: string,"entity_type"?: Database["public"]['Enums']["entity_type"],"id"?: string,"org_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "comments_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"document_versions": {
                  Row: {
                    "created_at": string,"document_id": string,"id": string,"mime_type": string,"org_id": string,"size_bytes": number,"storage_path": string,"uploaded_by": string | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"document_id": string,"id"?: string,"mime_type": string,"org_id": string,"size_bytes": number,"storage_path": string,"uploaded_by"?: string | null,"version": number
                  }
                  Update: {
                    "created_at"?: string,"document_id"?: string,"id"?: string,"mime_type"?: string,"org_id"?: string,"size_bytes"?: number,"storage_path"?: string,"uploaded_by"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "document_versions_document_fk"
      columns: ["document_id","org_id"]
isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id","org_id"]
    },{
      foreignKeyName: "document_versions_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "document_versions_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"documents": {
                  Row: {
                    "created_at": string,"current_version": number,"id": string,"name": string,"org_id": string,"permit_id": string | null,"project_id": string,"updated_at": string,"uploaded_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"current_version"?: number,"id"?: string,"name": string,"org_id": string,"permit_id"?: string | null,"project_id": string,"updated_at"?: string,"uploaded_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"current_version"?: number,"id"?: string,"name"?: string,"org_id"?: string,"permit_id"?: string | null,"project_id"?: string,"updated_at"?: string,"uploaded_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "documents_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documents_permit_fk"
      columns: ["permit_id","org_id"]
isOneToOne: false
      referencedRelation: "permits"
      referencedColumns: ["id","org_id"]
    },{
      foreignKeyName: "documents_project_fk"
      columns: ["project_id","org_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id","org_id"]
    },{
      foreignKeyName: "documents_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"invites": {
                  Row: {
                    "accepted_at": string | null,"accepted_by": string | null,"created_at": string,"created_by": string | null,"email": string,"expires_at": string,"id": string,"org_id": string,"revoked_at": string | null,"role": Database["public"]['Enums']["org_role"],"token_hash": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"created_at"?: string,"created_by"?: string | null,"email": string,"expires_at"?: string,"id"?: string,"org_id": string,"revoked_at"?: string | null,"role"?: Database["public"]['Enums']["org_role"],"token_hash": string
                  }
                  Update: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"created_at"?: string,"created_by"?: string | null,"email"?: string,"expires_at"?: string,"id"?: string,"org_id"?: string,"revoked_at"?: string | null,"role"?: Database["public"]['Enums']["org_role"],"token_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "invites_accepted_by_fkey"
      columns: ["accepted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invites_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invites_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "body": string,"created_at": string,"dedupe_key": string | null,"id": string,"link": string | null,"org_id": string,"read_at": string | null,"title": string,"type": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string,"created_at"?: string,"dedupe_key"?: string | null,"id"?: string,"link"?: string | null,"org_id": string,"read_at"?: string | null,"title": string,"type": string,"user_id": string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"dedupe_key"?: string | null,"id"?: string,"link"?: string | null,"org_id"?: string,"read_at"?: string | null,"title"?: string,"type"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_member_fk"
      columns: ["org_id","user_id"]
isOneToOne: false
      referencedRelation: "organization_members"
      referencedColumns: ["org_id","user_id"]
    }
                  ]
                },"organization_members": {
                  Row: {
                    "created_at": string,"org_id": string,"role": Database["public"]['Enums']["org_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"org_id": string,"role"?: Database["public"]['Enums']["org_role"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"org_id"?: string,"role"?: Database["public"]['Enums']["org_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "organization_members_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "organization_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"organizations": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"is_demo": boolean,"name": string,"slug": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"is_demo"?: boolean,"name": string,"slug": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"is_demo"?: boolean,"name"?: string,"slug"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "organizations_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"permits": {
                  Row: {
                    "application_number": string | null,"approved_at": string | null,"assignee_id": string | null,"created_at": string,"created_by": string | null,"expires_at": string | null,"id": string,"jurisdiction": string,"name": string,"notes": string,"org_id": string,"permit_type": Database["public"]['Enums']["permit_type"],"project_id": string,"status": Database["public"]['Enums']["permit_status"],"status_changed_at": string,"submitted_at": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "application_number"?: string | null,"approved_at"?: string | null,"assignee_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"expires_at"?: string | null,"id"?: string,"jurisdiction"?: string,"name": string,"notes"?: string,"org_id": string,"permit_type"?: Database["public"]['Enums']["permit_type"],"project_id": string,"status"?: Database["public"]['Enums']["permit_status"],"status_changed_at"?: string,"submitted_at"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "application_number"?: string | null,"approved_at"?: string | null,"assignee_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"expires_at"?: string | null,"id"?: string,"jurisdiction"?: string,"name"?: string,"notes"?: string,"org_id"?: string,"permit_type"?: Database["public"]['Enums']["permit_type"],"project_id"?: string,"status"?: Database["public"]['Enums']["permit_status"],"status_changed_at"?: string,"submitted_at"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "permits_assignee_is_member"
      columns: ["org_id","assignee_id"]
isOneToOne: false
      referencedRelation: "organization_members"
      referencedColumns: ["org_id","user_id"]
    },{
      foreignKeyName: "permits_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "permits_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "permits_project_fk"
      columns: ["project_id","org_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id","org_id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"created_at": string,"email": string,"full_name": string,"id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"created_at"?: string,"email": string,"full_name"?: string,"id": string,"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"created_at"?: string,"email"?: string,"full_name"?: string,"id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"projects": {
                  Row: {
                    "address": string,"city": string,"created_at": string,"created_by": string | null,"id": string,"jurisdiction": string,"manager_id": string | null,"name": string,"org_id": string,"project_type": Database["public"]['Enums']["project_type"],"start_date": string | null,"status": Database["public"]['Enums']["project_status"],"target_completion_date": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string,"city"?: string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"jurisdiction"?: string,"manager_id"?: string | null,"name": string,"org_id": string,"project_type"?: Database["public"]['Enums']["project_type"],"start_date"?: string | null,"status"?: Database["public"]['Enums']["project_status"],"target_completion_date"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "address"?: string,"city"?: string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"jurisdiction"?: string,"manager_id"?: string | null,"name"?: string,"org_id"?: string,"project_type"?: Database["public"]['Enums']["project_type"],"start_date"?: string | null,"status"?: Database["public"]['Enums']["project_status"],"target_completion_date"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "projects_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_manager_is_member"
      columns: ["org_id","manager_id"]
isOneToOne: false
      referencedRelation: "organization_members"
      referencedColumns: ["org_id","user_id"]
    },{
      foreignKeyName: "projects_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"tasks": {
                  Row: {
                    "assignee_id": string | null,"completed_at": string | null,"created_at": string,"created_by": string | null,"description": string,"due_date": string | null,"id": string,"is_correction": boolean,"org_id": string,"permit_id": string | null,"priority": Database["public"]['Enums']["task_priority"],"project_id": string,"status": Database["public"]['Enums']["task_status"],"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assignee_id"?: string | null,"completed_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string,"due_date"?: string | null,"id"?: string,"is_correction"?: boolean,"org_id": string,"permit_id"?: string | null,"priority"?: Database["public"]['Enums']["task_priority"],"project_id": string,"status"?: Database["public"]['Enums']["task_status"],"title": string,"updated_at"?: string
                  }
                  Update: {
                    "assignee_id"?: string | null,"completed_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string,"due_date"?: string | null,"id"?: string,"is_correction"?: boolean,"org_id"?: string,"permit_id"?: string | null,"priority"?: Database["public"]['Enums']["task_priority"],"project_id"?: string,"status"?: Database["public"]['Enums']["task_status"],"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tasks_assignee_is_member"
      columns: ["org_id","assignee_id"]
isOneToOne: false
      referencedRelation: "organization_members"
      referencedColumns: ["org_id","user_id"]
    },{
      foreignKeyName: "tasks_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_org_id_fkey"
      columns: ["org_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_permit_fk"
      columns: ["permit_id","org_id"]
isOneToOne: false
      referencedRelation: "permits"
      referencedColumns: ["id","org_id"]
    },{
      foreignKeyName: "tasks_project_fk"
      columns: ["project_id","org_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id","org_id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_invite":
{ Args: { "p_token": string }; Returns: string
                           },
"can_edit_org":
{ Args: { "p_org_id": string }; Returns: boolean
                           },
"changed_fields":
{ Args: { "p_ignore": (string)[],"p_new": Json,"p_old": Json }; Returns: (string)[]
                           },
"create_organization":
{ Args: { "p_name": string,"p_slug": string }; Returns: {
              "created_at": string,
"created_by": string | null,
"id": string,
"is_demo": boolean,
"name": string,
"slug": string,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "organizations"
        isOneToOne: true
        isSetofReturn: false
      } },
"get_invite":
{ Args: { "p_token": string }; Returns: {
              "email": string,"org_name": string,"org_slug": string,"role": Database["public"]['Enums']["org_role"],"status": string
            }[]
                           },
"has_org_role":
{ Args: { "p_org_id": string,"p_roles": (Database["public"]['Enums']["org_role"])[] }; Returns: boolean
                           },
"hash_invite_token":
{ Args: { "p_token": string }; Returns: string
                           },
"humanize":
{ Args: { "p_value": string }; Returns: string
                           },
"is_org_member":
{ Args: { "p_org_id": string }; Returns: boolean
                           },
"log_activity":
{ Args: { "p_action": string,"p_entity_id": string,"p_entity_type": Database["public"]['Enums']["entity_type"],"p_metadata"?: Json,"p_org_id": string,"p_project_id": string }; Returns: undefined
                           },
"notify":
{ Args: { "p_body": string,"p_link": string,"p_org_id": string,"p_title": string,"p_type": string,"p_user_id": string }; Returns: undefined
                           },
"shares_org_with":
{ Args: { "p_user_id": string }; Returns: boolean
                           },
"storage_object_org_id":
{ Args: { "p_name": string }; Returns: string
                           }
          }
          Enums: {
            "entity_type": "organization"|"member"|"project"|"permit"|"task"|"document","org_role": "admin"|"project_manager"|"viewer","permit_status": "draft"|"submitted"|"under_review"|"corrections_required"|"approved"|"rejected"|"expired"|"closed","permit_type": "building"|"electrical"|"plumbing"|"mechanical"|"demolition"|"grading"|"fire"|"signage"|"other","project_status": "active"|"on_hold"|"completed"|"archived","project_type": "residential"|"commercial"|"renovation"|"other","task_priority": "low"|"medium"|"high"|"urgent","task_status": "todo"|"in_progress"|"done"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "entity_type": ["organization", "member", "project", "permit", "task", "document"],"org_role": ["admin", "project_manager", "viewer"],"permit_status": ["draft", "submitted", "under_review", "corrections_required", "approved", "rejected", "expired", "closed"],"permit_type": ["building", "electrical", "plumbing", "mechanical", "demolition", "grading", "fire", "signage", "other"],"project_status": ["active", "on_hold", "completed", "archived"],"project_type": ["residential", "commercial", "renovation", "other"],"task_priority": ["low", "medium", "high", "urgent"],"task_status": ["todo", "in_progress", "done"]
          }
        }
} as const
