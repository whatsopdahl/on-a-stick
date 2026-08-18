import { useState } from 'react';
import { Box, IconButton, Typography, Tooltip } from '@mui/material';
import { ThumbUp, ThumbUpOffAlt } from '@mui/icons-material';

export default function LikeButton({ pin, likes, members, currentUserId, onToggleLike, size = 'small', sx }) {
  const [loading, setLoading] = useState(false);

  const pinLikes = likes.filter((l) => l.pin_id === pin.id);
  const likedByMe = pinLikes.some((l) => l.user_id === currentUserId);
  const likerNames = pinLikes.map((l) => members.find((m) => m.id === l.user_id)?.display_name ?? 'Unknown');

  const handleClick = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await onToggleLike(pin.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title={likerNames.length ? likerNames.join(', ') : 'Be the first to like this'}>
      <Box
        sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, ...sx }}
        onClick={(e) => e.stopPropagation()}
      >
        {pinLikes.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 12 }}>
            {pinLikes.length}
          </Typography>
        )}
        <IconButton
          size={size}
          onClick={handleClick}
          disabled={loading}
          color={likedByMe ? 'secondary' : 'default'}
        >
          {likedByMe ? <ThumbUp fontSize={size} /> : <ThumbUpOffAlt fontSize={size} />}
        </IconButton>
      </Box>
    </Tooltip>
  );
}
