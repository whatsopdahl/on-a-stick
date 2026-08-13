import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Menu, MenuItem, Avatar, ListItemIcon, ListItemText, Divider, Typography } from '@mui/material';
import { Person, Logout } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function ProfileMenu() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(null);

  const initial = profile?.display_name?.[0]?.toUpperCase() ?? '?';
  const color = profile?.color ?? '#2196F3';

  return (
    <>
      <IconButton onClick={(e) => setAnchor(e.currentTarget)} sx={{ p: 0.5, ml: 0.5 }}>
        <Avatar sx={{ bgcolor: color, width: 32, height: 32, fontSize: '0.875rem', fontWeight: 700 }}>
          {initial}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { elevation: 3, sx: { minWidth: 180, mt: 0.5 } } }}
      >
        {profile && (
          <MenuItem disabled sx={{ opacity: '1 !important' }}>
            <Avatar sx={{ bgcolor: color, width: 28, height: 28, fontSize: '0.8rem', fontWeight: 700, mr: 1.5 }}>
              {initial}
            </Avatar>
            <Typography variant="body2" fontWeight={600} noWrap>{profile.display_name}</Typography>
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => { setAnchor(null); navigate('/profile'); }}>
          <ListItemIcon><Person fontSize="small" /></ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setAnchor(null); signOut(); }}>
          <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
