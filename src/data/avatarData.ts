
export interface AvatarProfile {
  id: string;
  name: string;
  image: string;
  price: number;
  rating: number;
  totalSales: number;
  creator: string;
  mbti: string;
  personality: string[];
  favorites: string[];
  growUpStory: string;
  voiceDescription: string;
  languages: string[];
  lifestyle: string[];
  galleryImages: string[];
  category: string;
  description: string;
}

export const avatarProfiles: AvatarProfile[] = [
  {
    id: '1',
    name: 'Oliver',
    image: '/lovable-uploads/bbe9701d-0f56-426e-8fff-fc196bea0815.png',
    price: 89.99,
    rating: 4.9,
    totalSales: 342,
    creator: 'KidsStudio',
    mbti: 'ENFP',
    personality: ['Cheerful', 'Curious', 'Energetic', 'Playful'],
    favorites: ['Building blocks', 'Storytelling', 'Adventure games', 'Ice cream'],
    growUpStory: 'Oliver grew up in a cozy suburban neighborhood where imagination was his best friend. He spent countless hours building fantastic worlds with his toys and sharing wild stories with anyone who would listen.',
    voiceDescription: 'Bright, enthusiastic child voice with infectious laughter',
    languages: ['English', 'Spanish'],
    lifestyle: ['Family-friendly', 'Educational', 'Creative play'],
    galleryImages: ['/lovable-uploads/bbe9701d-0f56-426e-8fff-fc196bea0815.png'],
    category: 'Kids',
    description: 'A joyful young avatar perfect for family content and educational interactions'
  },
  {
    id: '2',
    name: 'Emma',
    image: '/lovable-uploads/621420e1-be52-41a0-a02b-9fa64b7a52f7.png',
    price: 129.99,
    rating: 4.8,
    totalSales: 287,
    creator: 'ProStudio',
    mbti: 'INTJ',
    personality: ['Professional', 'Analytical', 'Confident', 'Detail-oriented'],
    favorites: ['Coffee', 'Strategic planning', 'Tech innovations', 'Minimalist design'],
    growUpStory: 'Emma climbed the corporate ladder through dedication and smart decision-making. She believes in efficiency and always looks for innovative solutions to complex problems.',
    voiceDescription: 'Clear, professional tone with authoritative presence',
    languages: ['English', 'German', 'French'],
    lifestyle: ['Business', 'Corporate', 'Leadership'],
    galleryImages: ['/lovable-uploads/621420e1-be52-41a0-a02b-9fa64b7a52f7.png'],
    category: 'Business',
    description: 'A sophisticated professional avatar ideal for corporate presentations and business communications'
  },
  {
    id: '3',
    name: 'Aria',
    image: '/lovable-uploads/ba97f001-ee2b-43d0-b1b7-2ae06d422f96.png',
    price: 149.99,
    rating: 4.9,
    totalSales: 456,
    creator: 'NatureStudio',
    mbti: 'ISFP',
    personality: ['Free-spirited', 'Artistic', 'Nature-loving', 'Adventurous'],
    favorites: ['Hiking', 'Photography', 'Sunset watching', 'Organic food'],
    growUpStory: 'Aria grew up in a small mountain town, always feeling most at home in nature. She discovered her love for photography while exploring hidden trails and capturing the beauty of untouched landscapes.',
    voiceDescription: 'Gentle, melodic voice with a hint of wanderlust',
    languages: ['English', 'Japanese', 'Korean'],
    lifestyle: ['Travel', 'Nature', 'Photography', 'Wellness'],
    galleryImages: ['/lovable-uploads/ba97f001-ee2b-43d0-b1b7-2ae06d422f96.png'],
    category: 'Lifestyle',
    description: 'A free-spirited avatar perfect for travel vlogs and nature content'
  },
  {
    id: '4',
    name: 'Marcus',
    image: '/lovable-uploads/7b694883-4403-4c7c-9361-01ac8871d1bc.png',
    price: 199.99,
    rating: 4.7,
    totalSales: 198,
    creator: 'TechStudio',
    mbti: 'ENTP',
    personality: ['Innovative', 'Analytical', 'Tech-savvy', 'Problem-solver'],
    favorites: ['Coding', 'AI research', 'Gaming', 'Tech gadgets'],
    growUpStory: 'Marcus started coding at age 10 and has been passionate about technology ever since. He believes in using AI to solve real-world problems and make life better for everyone.',
    voiceDescription: 'Confident, clear voice with technical precision',
    languages: ['English', 'Python', 'JavaScript'],
    lifestyle: ['Technology', 'Innovation', 'Programming'],
    galleryImages: ['/lovable-uploads/7b694883-4403-4c7c-9361-01ac8871d1bc.png'],
    category: 'Technology',
    description: 'A tech-savvy avatar perfect for programming tutorials and tech content'
  },
  {
    id: '5',
    name: 'Luna',
    image: '/lovable-uploads/3da4a6b0-da99-437a-8673-fcf40dadcace.png',
    price: 159.99,
    rating: 4.8,
    totalSales: 324,
    creator: 'ArtStudio',
    mbti: 'INFP',
    personality: ['Creative', 'Dreamy', 'Artistic', 'Empathetic'],
    favorites: ['Painting', 'Poetry', 'Moon gazing', 'Vintage books'],
    growUpStory: 'Luna has always been drawn to the mystical and beautiful. She spends her nights painting under moonlight and writing poetry that captures the essence of dreams and emotions.',
    voiceDescription: 'Soft, dreamy voice with artistic flair',
    languages: ['English', 'French', 'Italian'],
    lifestyle: ['Art', 'Poetry', 'Mystical', 'Creative'],
    galleryImages: ['/lovable-uploads/3da4a6b0-da99-437a-8673-fcf40dadcace.png'],
    category: 'Art',
    description: 'An artistic avatar perfect for creative content and artistic inspiration'
  },
  {
    id: '6',
    name: 'Zara',
    image: '/lovable-uploads/7a5cf907-e9a9-4f4f-b32f-a0e2f2697662.png',
    price: 179.99,
    rating: 4.6,
    totalSales: 267,
    creator: 'FashionStudio',
    mbti: 'ESFP',
    personality: ['Stylish', 'Confident', 'Trendy', 'Social'],
    favorites: ['Fashion design', 'Shopping', 'Social media', 'Parties'],
    growUpStory: 'Zara grew up in the fashion capital, always ahead of trends. She has an eye for style and loves helping others express themselves through fashion and beauty.',
    voiceDescription: 'Confident, stylish voice with modern appeal',
    languages: ['English', 'Spanish', 'Portuguese'],
    lifestyle: ['Fashion', 'Beauty', 'Social media', 'Lifestyle'],
    galleryImages: ['/lovable-uploads/7a5cf907-e9a9-4f4f-b32f-a0e2f2697662.png'],
    category: 'Fashion',
    description: 'A fashionable avatar perfect for style content and beauty tutorials'
  },
  {
    id: '7',
    name: 'Alex',
    image: '/lovable-uploads/620dccd2-1550-40be-95ed-1f20ad2f9b32.png',
    price: 139.99,
    rating: 4.7,
    totalSales: 445,
    creator: 'FitnessStudio',
    mbti: 'ESTP',
    personality: ['Energetic', 'Motivational', 'Athletic', 'Positive'],
    favorites: ['Workout', 'Sports', 'Healthy food', 'Outdoor activities'],
    growUpStory: 'Alex discovered the power of fitness early in life and has dedicated themselves to helping others achieve their health goals through motivation and proper training.',
    voiceDescription: 'Energetic, motivational voice that inspires action',
    languages: ['English', 'Spanish', 'German'],
    lifestyle: ['Fitness', 'Health', 'Sports', 'Wellness'],
    galleryImages: ['/lovable-uploads/620dccd2-1550-40be-95ed-1f20ad2f9b32.png'],
    category: 'Fitness',
    description: 'A fitness-focused avatar perfect for workout content and health motivation'
  },
  {
    id: '8',
    name: 'Sage',
    image: '/lovable-uploads/1fab5331-8802-41ed-b1c5-5d8aab9b3268.png',
    price: 189.99,
    rating: 4.9,
    totalSales: 156,
    creator: 'WellnessStudio',
    mbti: 'INFJ',
    personality: ['Wise', 'Calm', 'Spiritual', 'Insightful'],
    favorites: ['Meditation', 'Philosophy', 'Tea ceremony', 'Ancient wisdom'],
    growUpStory: 'Sage has spent years studying ancient wisdom traditions and mindfulness practices. They bring peace and insight to every conversation, helping others find inner balance.',
    voiceDescription: 'Calm, wise voice with meditative quality',
    languages: ['English', 'Sanskrit', 'Tibetan'],
    lifestyle: ['Spirituality', 'Meditation', 'Philosophy', 'Wellness'],
    galleryImages: ['/lovable-uploads/1fab5331-8802-41ed-b1c5-5d8aab9b3268.png'],
    category: 'Wellness',
    description: 'A wise avatar perfect for spiritual content and mindfulness guidance'
  },
  {
    id: '9',
    name: 'Nova',
    image: '/lovable-uploads/269d4ca1-a66f-47a0-98ec-ab49afb20a1e.png',
    price: 219.99,
    rating: 4.8,
    totalSales: 203,
    creator: 'SciFiStudio',
    mbti: 'INTJ',
    personality: ['Futuristic', 'Intelligent', 'Curious', 'Innovative'],
    favorites: ['Space exploration', 'Quantum physics', 'Sci-fi movies', 'Technology'],
    growUpStory: 'Nova comes from a future where technology and humanity have merged harmoniously. They bring knowledge from tomorrow to help solve today\'s challenges.',
    voiceDescription: 'Futuristic, intelligent voice with cosmic wisdom',
    languages: ['English', 'Binary', 'Quantum'],
    lifestyle: ['Future tech', 'Space', 'Innovation', 'Science'],
    galleryImages: ['/lovable-uploads/269d4ca1-a66f-47a0-98ec-ab49afb20a1e.png'],
    category: 'Sci-Fi',
    description: 'A futuristic avatar perfect for sci-fi content and technology discussions'
  },
  {
    id: '10',
    name: 'River',
    image: '/lovable-uploads/1ed5d919-4459-4a2b-a32a-aeaf07f4779a.png',
    price: 169.99,
    rating: 4.6,
    totalSales: 298,
    creator: 'AdventureStudio',
    mbti: 'ENFJ',
    personality: ['Adventurous', 'Leadership', 'Inspiring', 'Brave'],
    favorites: ['Rock climbing', 'Camping', 'Leadership', 'Team building'],
    growUpStory: 'River grew up exploring the wilderness and leading adventure expeditions. They inspire others to push their limits and discover what they\'re truly capable of.',
    voiceDescription: 'Strong, inspiring voice that motivates adventure',
    languages: ['English', 'Spanish', 'Mandarin'],
    lifestyle: ['Adventure', 'Leadership', 'Outdoors', 'Team building'],
    galleryImages: ['/lovable-uploads/1ed5d919-4459-4a2b-a32a-aeaf07f4779a.png'],
    category: 'Adventure',
    description: 'An adventurous avatar perfect for outdoor content and leadership inspiration'
  },
  {
    id: '11',
    name: 'Echo',
    image: '/lovable-uploads/fb81f7c4-2479-410b-b5f5-507182401c0c.png',
    price: 199.99,
    rating: 4.7,
    totalSales: 178,
    creator: 'MusicStudio',
    mbti: 'ISFP',
    personality: ['Musical', 'Creative', 'Emotional', 'Expressive'],
    favorites: ['Music composition', 'Singing', 'Dancing', 'Audio production'],
    growUpStory: 'Echo discovered their musical talents at a young age and has been creating beautiful melodies ever since. They believe music is the universal language that connects all hearts.',
    voiceDescription: 'Melodic, expressive voice perfect for singing and narration',
    languages: ['English', 'Italian', 'Japanese'],
    lifestyle: ['Music', 'Performance', 'Audio', 'Creative arts'],
    galleryImages: ['/lovable-uploads/fb81f7c4-2479-410b-b5f5-507182401c0c.png'],
    category: 'Music',
    description: 'A musical avatar perfect for audio content and musical performances'
  }
];
