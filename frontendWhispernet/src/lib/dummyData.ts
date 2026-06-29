// Mock data for WhisperNet - Anonymous Campus Social Media App

export interface User {
  id: string;
  anonymousId: string;
  reputationLevel: number;
  avatar: string;
}

export interface Comment {
  id: string;
  user: User;
  content: string;
  timestamp: string;
}

export interface Whisper {
  id: string;
  user: User;
  content: string;
  timestamp: string;
  upvotes: number;
  downvotes: number;
  comments: Comment[];
  likes: number;
  isLiked: boolean;
  isUpvoted: boolean;
  isDownvoted: boolean;
}

export interface ReportedPost {
  id: string;
  reportedBy: string;
  postContent: string;
  reason: string;
  timestamp: string;
  status: 'pending' | 'dismissed' | 'deleted';
}

export interface Notification {
  id: string;
  type: 'like' | 'comment';
  user: User;
  postContent: string;
  timestamp: string;
  read: boolean;
}

// Generate anonymous user identities
export const anonymousNames = [
  'Shadow Fox', 'Silent Wolf', 'Mystic Owl', 'Phantom Cat', 'Ghost Bear',
  'Stealth Eagle', 'Hidden Tiger', 'Secret Raven', 'Masked Hawk', 'Dark Deer',
  'Whisper Lion', 'Quiet Shark', 'Veiled Snake', 'Cloaked Dragon', 'Anonymous Falcon'
];

export const generateUser = (): User => {
  const randomName = anonymousNames[Math.floor(Math.random() * anonymousNames.length)];
  const randomNumber = Math.floor(Math.random() * 999) + 1;
  return {
    id: `user_${Math.random().toString(36).substr(2, 9)}`,
    anonymousId: `${randomName} #${randomNumber}`,
    reputationLevel: Math.floor(Math.random() * 10) + 1,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomName}${randomNumber}`
  };
};

// Mock whispers data
export const mockWhispers: Whisper[] = [
  {
    id: '1',
    user: generateUser(),
    content: "Anyone else feeling overwhelmed with midterm season? The library is packed 24/7 and I can barely find a quiet spot to study. How are you all managing the stress?",
    timestamp: '2024-01-15T14:30:00Z',
    upvotes: 24,
    downvotes: 2,
    comments: [],
    likes: 15,
    isLiked: false,
    isUpvoted: false,
    isDownvoted: false
  },
  {
    id: '2',
    user: generateUser(),
    content: "Unpopular opinion: The new dining hall food is actually pretty good! The pasta station has been killing it lately. Finally some decent meals on campus.",
    timestamp: '2024-01-15T12:45:00Z',
    upvotes: 18,
    downvotes: 7,
    comments: [],
    likes: 9,
    isLiked: true,
    isUpvoted: true,
    isDownvoted: false
  },
  {
    id: '3',
    user: generateUser(),
    content: "Does anyone know what happened to Professor Johnson's CS201 class today? I waited 20 minutes and no one showed up. Did I miss an announcement?",
    timestamp: '2024-01-15T10:20:00Z',
    upvotes: 31,
    downvotes: 1,
    comments: [],
    likes: 7,
    isLiked: false,
    isUpvoted: false,
    isDownvoted: false
  },
  {
    id: '4',
    user: generateUser(),
    content: "Shoutout to whoever left encouraging sticky notes in the bathroom stalls during finals week last semester. Those little messages really made my day! ❤️",
    timestamp: '2024-01-15T09:15:00Z',
    upvotes: 42,
    downvotes: 0,
    comments: [],
    likes: 28,
    isLiked: false,
    isUpvoted: false,
    isDownvoted: false
  },
  {
    id: '5',
    user: generateUser(),
    content: "Is it just me or is the campus WiFi getting worse every week? I can't even load a simple webpage in the student center anymore. IT needs to get their act together.",
    timestamp: '2024-01-15T08:50:00Z',
    upvotes: 56,
    downvotes: 3,
    comments: [],
    likes: 12,
    isLiked: false,
    isUpvoted: false,
    isDownvoted: false
  },
  {
    id: '6',
    user: generateUser(),
    content: "Found a lost iPhone 14 near the engineering building this morning. It has a purple case with stickers. DM me with the wallpaper description to claim it!",
    timestamp: '2024-01-15T07:30:00Z',
    upvotes: 89,
    downvotes: 0,
    comments: [],
    likes: 45,
    isLiked: true,
    isUpvoted: false,
    isDownvoted: false
  },
  {
    id: '7',
    user: generateUser(),
    content: "Hot take: 8am classes should be banned. My brain doesn't start working until at least 10am and I'm pretty sure I'm not alone in this. Who thought this was a good idea?",
    timestamp: '2024-01-15T06:45:00Z',
    upvotes: 127,
    downvotes: 8,
    comments: [],
    likes: 67,
    isLiked: false,
    isUpvoted: false,
    isDownvoted: false
  }
];

// Mock reported posts data
export const mockReportedPosts: ReportedPost[] = [
  {
    id: 'report_1',
    reportedBy: 'Ghost Bear #445',
    postContent: 'This professor is absolutely terrible and shouldn\'t be teaching...',
    reason: 'Personal attack/harassment',
    timestamp: '2024-01-15T13:20:00Z',
    status: 'pending'
  },
  {
    id: 'report_2',
    reportedBy: 'Silent Wolf #782',
    postContent: 'Anyone know where I can get answers for the CHEM102 exam...',
    reason: 'Academic dishonesty',
    timestamp: '2024-01-15T11:45:00Z',
    status: 'pending'
  },
  {
    id: 'report_3',
    reportedBy: 'Mystic Owl #156',
    postContent: 'I hate this school and everyone here is stupid...',
    reason: 'Hate speech/discrimination',
    timestamp: '2024-01-15T09:30:00Z',
    status: 'pending'
  },
  {
    id: 'report_4',
    reportedBy: 'Phantom Cat #923',
    postContent: 'Check out this awesome party tonight at...',
    reason: 'Spam/off-topic',
    timestamp: '2024-01-15T08:15:00Z',
    status: 'dismissed'
  }
];

// Mock notifications data
export const mockNotifications: Notification[] = [
  {
    id: 'notif_1',
    type: 'comment',
    user: generateUser(),
    postContent: "Anyone else feeling overwhelmed with midterm season?...",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    read: false,
  },
  {
    id: 'notif_2',
    type: 'like',
    user: generateUser(),
    postContent: "Unpopular opinion: The new dining hall food is actually pretty good!...",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    read: false,
  },
  {
    id: 'notif_3',
    type: 'like',
    user: generateUser(),
    postContent: "Shoutout to whoever left encouraging sticky notes in the bathroom...",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
  },
  {
    id: 'notif_4',
    type: 'comment',
    user: generateUser(),
    postContent: "Hot take: 8am classes should be banned...",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    read: true,
  },
];