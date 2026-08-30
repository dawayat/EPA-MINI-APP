import {
  AnnouncementComment,
  AnnouncementVoteChoice,
  AnnouncementVoteSummary,
  MemberMessage
} from '../types';

const COMMUNITY_EVENT = 'epa-community-updated';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `Community request failed (${response.status})`);
  }
  return data as T;
}

function post<T>(body: Record<string, unknown>) {
  return request<T>('/api/community', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export function notifyCommunityUpdate() {
  window.dispatchEvent(new Event(COMMUNITY_EVENT));
}

export function onCommunityUpdate(listener: () => void) {
  window.addEventListener(COMMUNITY_EVENT, listener);
  return () => window.removeEventListener(COMMUNITY_EVENT, listener);
}

export function fetchAnnouncementComments(announcementId: string) {
  return request<AnnouncementComment[]>(
    `/api/community?action=comments&announcementId=${encodeURIComponent(announcementId)}`
  );
}

export async function fetchAnnouncementVote(announcementId: string, memberId: string) {
  const vote = await request<{ choice: AnnouncementVoteChoice } | null>(
    `/api/community?action=vote&announcementId=${encodeURIComponent(announcementId)}&memberId=${encodeURIComponent(memberId)}`
  );
  return vote?.choice ?? null;
}

export function fetchAnnouncementVoteSummary(announcementId: string) {
  return request<AnnouncementVoteSummary>(
    `/api/community?action=vote-summary&announcementId=${encodeURIComponent(announcementId)}`
  );
}

export function postAnnouncementComment(announcementId: string, memberId: string, content: string) {
  return post<{ comment: AnnouncementComment }>({
    action: 'comment', announcementId, memberId, content
  });
}

export function castAnnouncementVote(announcementId: string, memberId: string, choice: AnnouncementVoteChoice) {
  return post<{ vote: { choice: AnnouncementVoteChoice } }>({
    action: 'vote', announcementId, memberId, choice
  });
}

export function fetchMemberMessages(memberId: string) {
  return request<MemberMessage[]>(
    `/api/community?action=messages&memberId=${encodeURIComponent(memberId)}`
  );
}

export function sendMemberMessage(senderId: string, recipientId: string, content: string) {
  return post<{ message: MemberMessage }>({
    action: 'message', senderId, recipientId, content
  });
}
