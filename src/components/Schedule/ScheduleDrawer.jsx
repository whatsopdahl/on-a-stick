import {
  Drawer, Box, Typography, List, ListItem, ListItemButton,
  ListItemText, ListItemAvatar, Avatar, Chip, IconButton,
  Divider, Alert,
} from '@mui/material';
import { Close, AccessTime } from '@mui/icons-material';
import dayjs from 'dayjs';
import { PIN_COLORS, PIN_EMOJIS, AUTHOR_COLORS } from '../Map/FairgroundsMap';

export default function ScheduleDrawer({ open, onClose, pins, members, onPinClick }) {
  // Group pins by day
  const grouped = pins.reduce((acc, pin) => {
    const day = dayjs(pin.start_time).format('YYYY-MM-DD');
    if (!acc[day]) acc[day] = [];
    acc[day].push(pin);
    return acc;
  }, {});

  const days = Object.keys(grouped).sort();

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '80vh', display: 'flex', flexDirection: 'column' } }}
    >
      {/* Header */}
      <Box sx={{ px: 3, pt: 2, pb: 1, flexShrink: 0 }}>
        <Box sx={{ width: 40, height: 4, bgcolor: 'divider', borderRadius: 2, mx: 'auto', mb: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AccessTime sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>Schedule</Typography>
          <IconButton onClick={onClose}><Close /></IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Time-sensitive activities in chronological order
        </Typography>
      </Box>

      {/* List */}
      <Box sx={{ overflow: 'auto', flex: 1, px: 1, pb: 3 }}>
        {pins.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
            <AccessTime sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">No scheduled activities yet</Typography>
            <Typography variant="body2" color="text.disabled">
              Add show or music pins with times to see them here
            </Typography>
          </Box>
        ) : (
          days.map((day, di) => (
            <Box key={day}>
              {/* Day header */}
              <Box sx={{ px: 2, py: 1, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} color="primary">
                  {dayjs(day).format('dddd, MMMM D')}
                </Typography>
                {di < days.length - 1 && <Divider sx={{ mt: 0.5 }} />}
              </Box>

              <List dense>
                {grouped[day].map((pin, idx) => {
                  const author = members.find((m) => m.id === pin.user_id);
                  const authorIdx = members.findIndex((m) => m.id === pin.user_id);
                  const authorColor = author?.color || AUTHOR_COLORS[Math.max(0, authorIdx) % AUTHOR_COLORS.length];
                  const start = dayjs(pin.start_time);
                  const end = pin.end_time ? dayjs(pin.end_time) : null;
                  const isOngoing = dayjs().isAfter(start) && (!end || dayjs().isBefore(end));
                  const isPast = end ? dayjs().isAfter(end) : dayjs().isAfter(start);

                  return (
                    <ListItemButton
                      key={pin.id}
                      onClick={() => onPinClick(pin)}
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        opacity: isPast ? 0.5 : 1,
                        bgcolor: isOngoing ? `${authorColor}18` : undefined,
                        border: isOngoing ? `1px solid ${authorColor}60` : '1px solid transparent',
                      }}
                    >
                      {/* Time column */}
                      <Box
                        sx={{
                          width: 72,
                          flexShrink: 0,
                          mr: 2,
                          textAlign: 'right',
                        }}
                      >
                        <Typography variant="caption" fontWeight={700} color={isOngoing ? authorColor : 'text.primary'}>
                          {start.format('h:mm A')}
                        </Typography>
                        {end && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {end.format('h:mm A')}
                          </Typography>
                        )}
                      </Box>

                      {/* Pin icon — author color with type emoji */}
                      <Box
                        sx={{
                          width: 36, height: 36,
                          borderRadius: '50%',
                          bgcolor: authorColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, flexShrink: 0, mr: 1.5,
                        }}
                      >
                        {PIN_EMOJIS[pin.type]}
                      </Box>

                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body2" fontWeight={600}>
                              {pin.title}
                            </Typography>
                            {isOngoing && (
                              <Chip label="NOW" size="small" color="success" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                            <Box
                              sx={{
                                width: 8, height: 8, borderRadius: '50%',
                                bgcolor: authorColor, flexShrink: 0,
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {author?.display_name ?? 'Unknown'}
                            </Typography>
                            <Chip
                              label={pin.type}
                              size="small"
                              sx={{
                                height: 16, fontSize: 10,
                                bgcolor: `${PIN_COLORS[pin.type]}18`,
                                color: PIN_COLORS[pin.type],
                              }}
                            />
                          </Box>
                        }
                      />
                    </ListItemButton>
                  );
                })}
              </List>

              {di < days.length - 1 && <Divider sx={{ mx: 2, mb: 1 }} />}
            </Box>
          ))
        )}
      </Box>
    </Drawer>
  );
}
