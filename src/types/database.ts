export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
}

export interface Couple {
  id: string;
  user_id: string;
  name1: string;
  name2: string;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  guests: number | null;
  package_type: string | null;
  notes: string | null;
  whatsapp: string | null;
  ceremony_type: string | null;
  created_at: string;
}

export interface Planner {
  id: string;
  couple_id: string;
  user_id: string;
  details: {
    ceremony_location?: string;
    reception_location?: string;
    celebrant?: string;
    style?: string;
    rituals?: string[];
    observations?: string;
    timeline?: Array<{
      time: string;
      activity: string;
      responsible: string;
    }>;
    procession?: Array<{
      order: number;
      label: string;
      names: string;
      music: string;
    }>;
    suppliers?: Array<{
      category: string;
      name: string;
      phone: string;
    }>;
  };
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  couple_id: string;
  user_id: string;
  task_key: string;
  completed: boolean;
  updated_at: string;
}

export interface Contract {
  id: string;
  couple_id: string;
  user_id: string;
  data: any; // Flexible JSON for contract fields
  created_at: string;
}
