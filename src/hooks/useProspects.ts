import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Prospect } from "@/types/prospect";

// Mapping centralisé DB -> TypeScript pour les prospects
export const mapDbToProspect = (p: any): Prospect => ({
  id: p.id,
  fullName: p.full_name,
  company: p.company,
  position: p.position || "",
  linkedinUrl: p.linkedin_url || "",
  status: p.status,
  source: p.source || "outbound",
  qualification: p.qualification,
  hype: p.hype,
  tags: p.tags || [],
  notes: [],
  history: [],
  reminderDate: p.reminder_date,
  firstMessageDate: p.first_message_date,
  assignedTo: p.assigned_to || "",
  createdAt: p.created_at,
  updatedAt: p.updated_at,
  lastContact: p.last_contact,
  followUpCount: p.follow_up_count || 0,
  email: p.email || undefined,
  r1_date: p.r1_date || undefined,
  r2_date: p.r2_date || undefined,
  lost_reason: p.lost_reason || undefined,
  proposed_slots: p.proposed_slots || undefined,
  no_show: p.no_show || false,
  proposal_sent: p.proposal_sent || false,
  r2_scheduled: p.r2_scheduled || false,
  no_follow_up: p.no_follow_up || false,
  websiteUrl: p.website_url || undefined,
  audit_status: p.audit_status || null,
});

// Mapping TypeScript -> DB pour les updates
export const mapProspectToDb = (prospect: Partial<Prospect>) => ({
  full_name: prospect.fullName,
  company: prospect.company,
  position: prospect.position,
  linkedin_url: prospect.linkedinUrl,
  status: prospect.status,
  source: prospect.source,
  qualification: prospect.qualification,
  hype: prospect.hype,
  tags: prospect.tags,
  reminder_date: prospect.reminderDate,
  first_message_date: prospect.firstMessageDate,
  last_contact: prospect.lastContact,
  follow_up_count: prospect.followUpCount,
  email: prospect.email,
  r1_date: prospect.r1_date,
  r2_date: prospect.r2_date,
  lost_reason: prospect.lost_reason,
  proposed_slots: prospect.proposed_slots,
  no_show: prospect.no_show,
  proposal_sent: prospect.proposal_sent,
  r2_scheduled: prospect.r2_scheduled,
  no_follow_up: prospect.no_follow_up,
  website_url: prospect.websiteUrl,
  audit_status: prospect.audit_status,
});

interface UseProspectsOptions {
  includeDeleted?: boolean;
  enableRealtime?: boolean;
}

const ADVANCED_STATUSES = ["r1_booke", "r1_fait", "r2_booke", "signe", "perdu"];

export const useProspects = (options: UseProspectsOptions = {}) => {
  const { includeDeleted = false, enableRealtime = true } = options;
  const navigate = useNavigate();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);

  const loadProspects = useCallback(async () => {
    setLoading(true);
    
    let query = supabase.from('prospects').select('*');
    
    if (!includeDeleted) {
      query = query.eq('is_deleted', false);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading prospects:', error);
      setLoading(false);
      return;
    }

    const loadedProspects = data.map(mapDbToProspect);
    setProspects(loadedProspects);

    // Calculate today count - exclure les prospects avancés dans le pipeline
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const count = loadedProspects.filter((p) => {
      if (!p.reminderDate) return false;
      if (ADVANCED_STATUSES.includes(p.status)) return false;
      const reminder = new Date(p.reminderDate);
      reminder.setHours(0, 0, 0, 0);
      return reminder <= today;
    }).length;
    setTodayCount(count);
    setLoading(false);
  }, [includeDeleted]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      loadProspects();
    });

    if (!enableRealtime) return;

    const channel = supabase
      .channel('prospects-hook-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prospects' }, () => {
        loadProspects();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate, loadProspects, enableRealtime]);

  return {
    prospects,
    loading,
    todayCount,
    refresh: loadProspects,
  };
};

export default useProspects;
