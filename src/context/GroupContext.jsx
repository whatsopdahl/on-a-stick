import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const GroupContext = createContext(null);

const PINS_CACHE_KEY = (groupId) => `pins_cache_${groupId}`;

export function GroupProvider({ children }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [pins, setPins] = useState([]);
  const [members, setMembers] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingPins, setLoadingPins] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const channelRef = useRef(null);

  // Online/offline detection
  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Load user's groups
  const fetchGroups = useCallback(async () => {
    if (!user) return;
    setLoadingGroups(true);
    try {
      const { data: groupsData, error } = await supabase
        .from('groups')
        .select('id, name, created_at, created_by');
      if (error || !groupsData) return;

      if (groupsData.length === 0) {
        setGroups([]);
        return;
      }

      const { data: membersData } = await supabase
        .from('group_members')
        .select('group_id, user_id')
        .in('group_id', groupsData.map((g) => g.id));

      setGroups(groupsData.map((g) => ({
        ...g,
        group_members: (membersData || []).filter((m) => m.group_id === g.id),
      })));
    } catch {
      // Offline - keep existing groups
    } finally {
      setLoadingGroups(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchGroups();
    else {
      setGroups([]);
      setCurrentGroup(null);
      setPins([]);
      setMembers([]);
    }
  }, [user, fetchGroups]);

  // Load pins + members for selected group, with offline cache fallback
  const fetchPins = useCallback(async (groupId) => {
    setLoadingPins(true);
    try {
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setPins(data);
        // Cache for offline
        try {
          localStorage.setItem(PINS_CACHE_KEY(groupId), JSON.stringify(data));
        } catch {}
      }
    } catch {
      // Offline - try cache
      try {
        const cached = localStorage.getItem(PINS_CACHE_KEY(groupId));
        if (cached) setPins(JSON.parse(cached));
      } catch {}
    } finally {
      setLoadingPins(false);
    }
  }, []);

  const fetchMembers = useCallback(async (groupId) => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('user_id, joined_at')
        .eq('group_id', groupId);

      if (memberError || !memberData?.length) { setMembers([]); return; }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, color')
        .in('id', memberData.map((m) => m.user_id));

      if (profileError) return;

      setMembers(
        memberData
          .map((m) => {
            const profile = (profileData || []).find((p) => p.id === m.user_id);
            return profile ? { ...profile, joined_at: m.joined_at } : null;
          })
          .filter(Boolean)
      );
    } catch {}
  }, []);

  const selectGroup = useCallback(async (group) => {
    setCurrentGroup(group);
    if (!group) {
      setPins([]);
      setMembers([]);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    await Promise.all([fetchPins(group.id), fetchMembers(group.id)]);

    // Set up real-time subscription for pins
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase
      .channel(`pins:${group.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pins', filter: `group_id=eq.${group.id}` },
        (payload) => {
          setPins((prev) => {
            if (prev.find((p) => p.id === payload.new.id)) return prev;
            const next = [...prev, payload.new];
            try { localStorage.setItem(PINS_CACHE_KEY(group.id), JSON.stringify(next)); } catch {}
            return next;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'pins', filter: `group_id=eq.${group.id}` },
        (payload) => {
          setPins((prev) => {
            const next = prev.filter((p) => p.id !== payload.old.id);
            try { localStorage.setItem(PINS_CACHE_KEY(group.id), JSON.stringify(next)); } catch {}
            return next;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pins', filter: `group_id=eq.${group.id}` },
        (payload) => {
          setPins((prev) => {
            const next = prev.map((p) => (p.id === payload.new.id ? payload.new : p));
            try { localStorage.setItem(PINS_CACHE_KEY(group.id), JSON.stringify(next)); } catch {}
            return next;
          });
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, [fetchPins, fetchMembers]);

  const createGroup = useCallback(async (name, password) => {
    const { data, error } = await supabase.rpc('create_group', {
      group_name: name,
      group_password: password,
    });
    if (error) throw error;
    await fetchGroups();
    return data;
  }, [fetchGroups]);

  const joinGroup = useCallback(async (groupId, password) => {
    const { data, error } = await supabase.rpc('join_group', {
      p_group_id: groupId,
      group_password: password,
    });
    if (error) throw error;
    if (!data) throw new Error('Incorrect password');
    await fetchGroups();
    return data;
  }, [fetchGroups]);

  const searchGroups = useCallback(async (term) => {
    const { data, error } = await supabase.rpc('search_groups_by_name', {
      search_term: term,
    });
    if (error) throw error;
    return data || [];
  }, []);

  const leaveGroup = useCallback(async (groupId) => {
    const { error } = await supabase.rpc('leave_group', { p_group_id: groupId });
    if (error) throw error;
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    if (currentGroup?.id === groupId) setCurrentGroup(null);
  }, [currentGroup]);

  const renameGroup = useCallback(async (groupId, newName) => {
    const { error } = await supabase.rpc('rename_group', { p_group_id: groupId, new_name: newName });
    if (error) throw error;
    setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, name: newName } : g));
    if (currentGroup?.id === groupId) setCurrentGroup((g) => ({ ...g, name: newName }));
  }, [currentGroup]);

  const changeGroupPassword = useCallback(async (groupId, newPassword) => {
    const { error } = await supabase.rpc('change_group_password', { p_group_id: groupId, new_password: newPassword });
    if (error) throw error;
  }, []);

  const deleteGroup = useCallback(async (groupId) => {
    const { error } = await supabase.rpc('delete_group', { p_group_id: groupId });
    if (error) throw error;
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    if (currentGroup?.id === groupId) { setCurrentGroup(null); setPins([]); setMembers([]); }
  }, [currentGroup]);

  const addPin = useCallback(async (pinData) => {
    const { data, error } = await supabase
      .from('pins')
      .insert({ ...pinData, group_id: currentGroup.id, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    setPins((prev) => {
      if (prev.find((p) => p.id === data.id)) return prev; // already added by Realtime
      const next = [...prev, data];
      try {
        if (currentGroup?.id) localStorage.setItem(PINS_CACHE_KEY(currentGroup.id), JSON.stringify(next));
      } catch {}
      return next;
    });
    return data;
  }, [currentGroup, user]);

  const deletePin = useCallback(async (pinId) => {
    const { error } = await supabase.from('pins').delete().eq('id', pinId);
    if (error) throw error;
    setPins((prev) => {
      const next = prev.filter((p) => p.id !== pinId);
      try {
        const groupId = currentGroup?.id;
        if (groupId) localStorage.setItem(PINS_CACHE_KEY(groupId), JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [currentGroup]);

  const updatePin = useCallback(async (pinId, updates) => {
    const { data, error } = await supabase
      .from('pins')
      .update(updates)
      .eq('id', pinId)
      .select()
      .single();
    if (error) throw error;
    setPins((prev) => {
      const next = prev.map((p) => (p.id === pinId ? data : p));
      try {
        const groupId = currentGroup?.id;
        if (groupId) localStorage.setItem(PINS_CACHE_KEY(groupId), JSON.stringify(next));
      } catch {}
      return next;
    });
    return data;
  }, [currentGroup]);

  return (
    <GroupContext.Provider value={{
      groups,
      currentGroup,
      pins,
      members,
      loadingGroups,
      loadingPins,
      isOffline,
      fetchGroups,
      selectGroup,
      createGroup,
      joinGroup,
      searchGroups,
      leaveGroup,
      renameGroup,
      changeGroupPassword,
      deleteGroup,
      addPin,
      deletePin,
      updatePin,
    }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error('useGroup must be used within GroupProvider');
  return ctx;
}
