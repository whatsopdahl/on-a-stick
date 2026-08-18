import {
  Box, Typography, List, ListItemButton, ListItemText,
  Chip, Divider,
} from '@mui/material';
import { EventBusy, CheckCircle } from '@mui/icons-material';
import dayjs from 'dayjs';
import { PIN_COLORS, PIN_EMOJIS, AUTHOR_COLORS } from '../Map/FairgroundsMap';

const TYPE_ORDER = ['food', 'music', 'activity', 'show', 'exhibit'];

function PinRow({ pin, members, memberColors, onPinClick, showTime }) {
  const author = members.find((m) => m.id === pin.user_id);
  const color = memberColors[pin.user_id] || AUTHOR_COLORS[0];
  const start = pin.start_time ? dayjs(pin.start_time) : null;
  const end = pin.end_time ? dayjs(pin.end_time) : null;
  const isOngoing = start && (dayjs().isAfter(start) && (!end || dayjs().isBefore(end)));
  const isPast = start && (end ? dayjs().isAfter(end) : dayjs().isAfter(start));

  return (
    <ListItemButton
      onClick={() => onPinClick(pin)}
      sx={{
        borderRadius: 2,
        mb: 0.5,
        opacity: pin.completed ? 0.5 : (isPast ? 0.5 : 1),
        bgcolor: isOngoing ? `${color}18` : undefined,
        border: isOngoing ? `1px solid ${color}60` : '1px solid transparent',
      }}
    >
      {showTime && (
        <Box sx={{ width: 72, flexShrink: 0, mr: 2, textAlign: 'right' }}>
          <Typography variant="caption" fontWeight={700} color={isOngoing ? color : 'text.primary'}>
            {start.format('h:mm A')}
          </Typography>
          {end && (
            <Typography variant="caption" display="block" color="text.secondary">
              {end.format('h:mm A')}
            </Typography>
          )}
        </Box>
      )}

      <Box
        sx={{
          width: 36, height: 36,
          borderRadius: '50%',
          bgcolor: pin.completed ? 'grey.500' : color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0, mr: 1.5,
        }}
      >
        {PIN_EMOJIS[pin.type]}
      </Box>

      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ textDecoration: pin.completed ? 'line-through' : 'none' }}
            >
              {pin.title}
            </Typography>
            {pin.completed && (
              <CheckCircle color="success" sx={{ fontSize: 16 }} />
            )}
            {isOngoing && !pin.completed && (
              <Chip label="NOW" size="small" color="success" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
            )}
          </Box>
        }
        secondary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary">
              {author?.display_name ?? 'Unknown'}
            </Typography>
          </Box>
        }
      />
    </ListItemButton>
  );
}

export default function EventListView({ pins, members, memberColors, onPinClick }) {
  const grouped = pins.reduce((acc, pin) => {
    if (!acc[pin.type]) acc[pin.type] = [];
    acc[pin.type].push(pin);
    return acc;
  }, {});

  const types = TYPE_ORDER.filter((type) => grouped[type]?.length);

  types.forEach((type) => {
    grouped[type].sort((a, b) => {
      if (a.start_time && b.start_time) return new Date(a.start_time) - new Date(b.start_time);
      if (a.start_time) return -1;
      if (b.start_time) return 1;
      return a.title.localeCompare(b.title);
    });
  });

  if (pins.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
        <EventBusy sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body1" color="text.secondary">No events match your filters</Typography>
        <Typography variant="body2" color="text.disabled">
          Try adjusting the filter settings
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto', px: 1, pt: 1, pb: 3 }}>
      <Typography variant="caption" color="text.secondary" sx={{ px: 2, display: 'block', mb: 1 }}>
        {pins.length} event{pins.length === 1 ? '' : 's'}
      </Typography>

      {types.map((type, ti) => (
        <Box key={type}>
          <Box sx={{ px: 2, py: 1, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ fontSize: 16, lineHeight: 1 }}>{PIN_EMOJIS[type]}</Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: PIN_COLORS[type] }}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Typography>
          </Box>
          <List dense>
            {grouped[type].map((pin) => (
              <PinRow key={pin.id} pin={pin} members={members} memberColors={memberColors} onPinClick={onPinClick} showTime={!!pin.start_time} />
            ))}
          </List>
          {ti < types.length - 1 && <Divider sx={{ mx: 2, mb: 1 }} />}
        </Box>
      ))}
    </Box>
  );
}
