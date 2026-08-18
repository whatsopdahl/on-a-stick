import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Fab, Tooltip,
  Chip, BottomNavigation, BottomNavigationAction, Badge, Snackbar,
  Alert,
} from '@mui/material';
import {
  ArrowBack, AddLocation, Map, ViewList, Schedule, FilterList,
  WifiOff, Close,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import FairgroundsMap from '../components/Map/FairgroundsMap';
import ProfileMenu from '../components/ProfileMenu';
import AddPinDialog from '../components/Pins/AddPinDialog';
import PinDetailDialog from '../components/Pins/PinDetailDialog';
import FilterPanel from '../components/Filters/FilterPanel';
import ScheduleDrawer from '../components/Schedule/ScheduleDrawer';
import EventListView from '../components/List/EventListView';
import { getMemberColorMap } from '../utils/memberColors';

export default function MapPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { groups, currentGroup, pins, members, isOffline, selectGroup, addPin, deletePin, updatePin, setPinCompleted } = useGroup();

  const [placing, setPlacing] = useState(false);
  const [pendingCoords, setPendingCoords] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);
  const [mainView, setMainView] = useState('map'); // 'map' | 'list'
  const [filterOpen, setFilterOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [filters, setFilters] = useState({
    types: new Set(['food', 'music', 'activity', 'show', 'exhibit']),
    authorIds: null, // null = all
    timeStart: null,
    timeEnd: null,
  });

  // Restore group from URL on direct navigation
  useEffect(() => {
    if (!currentGroup && groups.length > 0) {
      const group = groups.find((g) => g.id === groupId);
      if (group) selectGroup(group);
    }
  }, [groupId, currentGroup, groups, selectGroup]);

  // Filtered pins
  const filteredPins = useMemo(() => {
    return pins.filter((pin) => {
      if (!filters.types.has(pin.type)) return false;
      if (filters.authorIds && !filters.authorIds.has(pin.user_id)) return false;
      if (filters.timeStart || filters.timeEnd) {
        if (pin.start_time) {
          const start = new Date(pin.start_time);
          const end = pin.end_time ? new Date(pin.end_time) : start;
          if (filters.timeStart && end < filters.timeStart) return false;
          if (filters.timeEnd && start > filters.timeEnd) return false;
        }
        // Non-time-constrained pins always show through time filter
      }
      return true;
    });
  }, [pins, filters]);

  const timeSensitivePins = useMemo(() =>
    pins
      .filter((p) => p.start_time)
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time)),
    [pins]
  );

  const memberColors = useMemo(() => getMemberColorMap(members, user?.id), [members, user?.id]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.types.size < 5) count++;
    if (filters.authorIds) count++;
    if (filters.timeStart || filters.timeEnd) count++;
    return count;
  }, [filters]);

  const handlePlacePin = useCallback((x, y) => {
    setPendingCoords({ x, y });
    setPlacing(false);
  }, []);

  const handleAddPin = useCallback(async (pinData) => {
    try {
      await addPin({ ...pinData, x: pendingCoords.x, y: pendingCoords.y });
      setPendingCoords(null);
      setSnackbar({ open: true, message: 'Pin added!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    }
  }, [addPin, pendingCoords]);

  const handleDeletePin = useCallback(async (pinId) => {
    try {
      await deletePin(pinId);
      setSelectedPin(null);
      setSnackbar({ open: true, message: 'Pin removed', severity: 'info' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    }
  }, [deletePin]);

  const handleUpdatePin = useCallback(async (pinId, updates) => {
    try {
      const updated = await updatePin(pinId, updates);
      setSelectedPin(updated);
      setSnackbar({ open: true, message: 'Pin updated', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    }
  }, [updatePin]);

  const handleToggleComplete = useCallback(async (pinId, completed) => {
    try {
      const updated = await setPinCompleted(pinId, completed);
      setSelectedPin(updated);
      setSnackbar({ open: true, message: completed ? 'Marked complete' : 'Marked incomplete', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    }
  }, [setPinCompleted]);

  // 0=Map, 1=List, 2=Schedule, 3=Filter
  const bottomNavValue = scheduleOpen ? 2 : filterOpen ? 3 : (mainView === 'map' ? 0 : 1);

  const handleBottomNav = (_, val) => {
    if (val === 0) { setMainView('map'); setScheduleOpen(false); setFilterOpen(false); }
    if (val === 1) { setMainView('list'); setScheduleOpen(false); setFilterOpen(false); }
    if (val === 2) setScheduleOpen(true);
    if (val === 3) setFilterOpen(true);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar variant="dense">
          <IconButton color="inherit" edge="start" onClick={() => navigate('/groups')} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }} noWrap>
            {currentGroup?.name ?? 'Loading...'}
          </Typography>
          {isOffline && (
            <Chip
              icon={<WifiOff fontSize="small" />}
              label="Offline"
              size="small"
              color="warning"
              sx={{ mr: 1 }}
            />
          )}
          {placing && (
            <Chip
              label="Tap map to place pin"
              size="small"
              color="secondary"
              onDelete={() => setPlacing(false)}
              deleteIcon={<Close />}
              sx={{ mr: 1 }}
            />
          )}
          <ProfileMenu />
        </Toolbar>
      </AppBar>

      {/* Map / List */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {mainView === 'map' ? (
          <FairgroundsMap
            pins={filteredPins}
            allPins={pins}
            memberColors={memberColors}
            placing={placing}
            currentUserId={user?.id}
            onPlacePin={handlePlacePin}
            onPinClick={(pin) => { setSelectedPin(pin); setPlacing(false); }}
          />
        ) : (
          <EventListView
            pins={filteredPins}
            members={members}
            memberColors={memberColors}
            onPinClick={(pin) => setSelectedPin(pin)}
          />
        )}

        {/* FAB - Add Pin */}
        {!placing && (
          <Tooltip title="Add a pin" placement="left">
            <Fab
              color="secondary"
              sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}
              onClick={() => { setMainView('map'); setPlacing(true); }}
            >
              <AddLocation />
            </Fab>
          </Tooltip>
        )}
      </Box>

      {/* Bottom Navigation */}
      <BottomNavigation value={bottomNavValue} onChange={handleBottomNav} showLabels>
        <BottomNavigationAction label="Map" icon={<Map />} />
        <BottomNavigationAction
          label="List"
          icon={
            <Badge badgeContent={filteredPins.length} color="default" max={99}>
              <ViewList />
            </Badge>
          }
        />
        <BottomNavigationAction
          label="Schedule"
          icon={
            <Badge badgeContent={timeSensitivePins.length} color="error" max={99}>
              <Schedule />
            </Badge>
          }
        />
        <BottomNavigationAction
          label="Filter"
          icon={
            <Badge badgeContent={activeFilterCount} color="primary">
              <FilterList />
            </Badge>
          }
        />
      </BottomNavigation>

      {/* Dialogs & Drawers */}
      <AddPinDialog
        open={!!pendingCoords}
        onClose={() => { setPendingCoords(null); }}
        onAdd={handleAddPin}
      />

      <PinDetailDialog
        pin={selectedPin}
        members={members}
        memberColors={memberColors}
        currentUserId={user?.id}
        isGroupCreator={currentGroup?.created_by === user?.id}
        open={!!selectedPin}
        onClose={() => setSelectedPin(null)}
        onDelete={handleDeletePin}
        onUpdate={handleUpdatePin}
        onToggleComplete={handleToggleComplete}
      />

      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onChange={setFilters}
        members={members}
        memberColors={memberColors}
      />

      <ScheduleDrawer
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        pins={timeSensitivePins}
        members={members}
        memberColors={memberColors}
        onPinClick={(pin) => { setSelectedPin(pin); setScheduleOpen(false); }}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
