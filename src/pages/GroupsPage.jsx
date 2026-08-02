import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Button,
  List, ListItem, ListItemText, ListItemButton, ListItemAvatar,
  Avatar, Divider, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Alert, CircularProgress,
  Chip, Fab, InputAdornment, Tab, Tabs, Badge,
} from '@mui/material';
import {
  Add, Search, Logout, Groups, Lock, Group, PersonAdd,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';

export default function GroupsPage() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { groups, loadingGroups, createGroup, joinGroup, searchGroups, selectGroup } = useGroup();

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const handleSelectGroup = async (group) => {
    await selectGroup(group);
    navigate(`/map/${group.id}`);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Your Groups
          </Typography>
          {profile && (
            <Chip
              label={profile.display_name}
              size="small"
              sx={{ mr: 1, bgcolor: profile.color, color: 'white', fontWeight: 600 }}
            />
          )}
          <IconButton color="inherit" onClick={signOut}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {loadingGroups ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : groups.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Groups sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">No groups yet</Typography>
            <Typography variant="body2" color="text.disabled" mb={3}>
              Create a group or join one to start planning
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
                Create Group
              </Button>
              <Button variant="outlined" startIcon={<Search />} onClick={() => setJoinOpen(true)}>
                Join Group
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <List>
              {groups.map((group, idx) => (
                <Box key={group.id}>
                  {idx > 0 && <Divider />}
                  <ListItemButton onClick={() => handleSelectGroup(group)} sx={{ borderRadius: 2, mb: 0.5 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <Group />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography fontWeight={600}>{group.name}</Typography>}
                      secondary={`${group.group_members?.length ?? 0} member${group.group_members?.length !== 1 ? 's' : ''}`}
                    />
                  </ListItemButton>
                </Box>
              ))}
            </List>
          </>
        )}
      </Box>

      {groups.length > 0 && (
        <Box sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Fab
            size="medium"
            color="default"
            onClick={() => setJoinOpen(true)}
            sx={{ boxShadow: 3 }}
          >
            <PersonAdd />
          </Fab>
          <Fab color="primary" onClick={() => setCreateOpen(true)}>
            <Add />
          </Fab>
        </Box>
      )}

      <CreateGroupDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={createGroup}
        onCreated={(id) => {
          setCreateOpen(false);
          navigate(`/map/${id}`);
        }}
        groups={groups}
        selectGroup={selectGroup}
      />

      <JoinGroupDialog
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        searchGroups={searchGroups}
        joinGroup={joinGroup}
        onJoined={(group) => {
          setJoinOpen(false);
          handleSelectGroup(group);
        }}
      />
    </Box>
  );
}

// ---- Create Group Dialog ----
function CreateGroupDialog({ open, onClose, onCreate, onCreated }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => { setName(''); setPassword(''); setConfirm(''); setError(''); };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 4) { setError('Password must be at least 4 characters'); return; }
    setLoading(true);
    setError('');
    try {
      const id = await onCreate(name.trim(), password);
      reset();
      onCreated(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>Create New Group</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Group Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              autoFocus
              placeholder="e.g. Smith Family Fair Day"
            />
            <TextField
              label="Group Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><Lock fontSize="small" /></InputAdornment> }}
              helperText="Share this with people you want to invite"
            />
            <TextField
              label="Confirm Password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading || !name.trim()}>
            {loading ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// ---- Join Group Dialog ----
function JoinGroupDialog({ open, onClose, searchGroups, joinGroup, onJoined }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);
  const [joining, setJoining] = useState(false);

  const reset = () => {
    setSearchTerm(''); setResults([]); setSelected(null);
    setPassword(''); setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setSearching(true);
    setError('');
    try {
      const data = await searchGroups(searchTerm.trim());
      setResults(data);
      if (data.length === 0) setError('No groups found with that name');
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setJoining(true);
    setError('');
    try {
      await joinGroup(selected.id, password);
      reset();
      onJoined(selected);
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>Join a Group</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {!selected ? (
          <form onSubmit={handleSearch}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Search by group name"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setError(''); }}
                fullWidth
                autoFocus
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton type="submit" disabled={searching}>
                        {searching ? <CircularProgress size={20} /> : <Search />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {results.length > 0 && (
                <List dense sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  {results.map((g, i) => (
                    <Box key={g.id}>
                      {i > 0 && <Divider />}
                      <ListItemButton onClick={() => { setSelected(g); setError(''); }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: 14 }}>
                            <Group fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={g.name}
                          secondary={`${g.member_count} member${g.member_count !== 1 ? 's' : ''}`}
                        />
                      </ListItemButton>
                    </Box>
                  ))}
                </List>
              )}
            </Box>
          </form>
        ) : (
          <form onSubmit={handleJoin}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}><Group /></Avatar>
                <Box>
                  <Typography fontWeight={600}>{selected.name}</Typography>
                  <Button size="small" onClick={() => { setSelected(null); setPassword(''); setError(''); }}>
                    Change
                  </Button>
                </Box>
              </Box>
              <TextField
                label="Group Password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                required
                fullWidth
                autoFocus
                InputProps={{ startAdornment: <InputAdornment position="start"><Lock fontSize="small" /></InputAdornment> }}
              />
              <Button type="submit" variant="contained" disabled={joining || !password}>
                {joining ? <CircularProgress size={20} /> : 'Join Group'}
              </Button>
            </Box>
          </form>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
