// Keep the publish payload complete so it matches the live email preview.
export function buildAnnouncement(announcement) {
  return {
    ...announcement,
    id: 'ann-' + Date.now(),
    title: announcement.title || 'Untitled Announcement',
    category: announcement.category || 'General',
    content: announcement.content || '',
    published_at: new Date().toISOString(),
    author: announcement.author || 'EPA Executive Directorate',
    likes_count: 0,
    views_count: 1
  };
}

export function announcementAttachments(a) {
  const attachments = [];
  if (a.location_url) attachments.push({ type: 'location', url: a.location_url, name: a.location_name, address: a.location_address, map_image_url: a.map_image_url });
  if (a.cover_photo_url) attachments.push({ type: 'cover', url: a.cover_photo_url, layout: a.venue_photo_layout, right_url: a.venue_photo_crop_url });
  if (a.file_attachment_url) attachments.push({ type: 'file', url: a.file_attachment_url });
  return attachments;
}
