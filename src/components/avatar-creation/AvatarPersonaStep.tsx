
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Brain, Trophy, Film, Music, Gamepad2, Book, Palette } from 'lucide-react';

interface AvatarPersonaStepProps {
  data: any;
  onUpdate: (field: string, value: any) => void;
}

export const AvatarPersonaStep: React.FC<AvatarPersonaStepProps> = ({ data, onUpdate }) => {
  const [selectedCategory, setSelectedCategory] = useState('sports');

  const tagCategories = {
    sports: {
      icon: Trophy,
      tags: [
        'Football', 'Basketball', 'Tennis', 'Swimming', 'Running', 'Cycling', 'Boxing', 'Wrestling',
        'Golf', 'Baseball', 'Volleyball', 'Badminton', 'Table Tennis', 'Hockey', 'Rugby', 'Cricket',
        'Skiing', 'Snowboarding', 'Surfing', 'Rock Climbing', 'Hiking', 'Yoga', 'Pilates', 'Martial Arts',
        'Crossfit', 'Weightlifting', 'Gymnastics', 'Track and Field', 'Triathlon', 'Marathon'
      ]
    },
    movies: {
      icon: Film,
      tags: [
        'Action', 'Comedy', 'Drama', 'Horror', 'Thriller', 'Romance', 'Sci-Fi', 'Fantasy',
        'Adventure', 'Mystery', 'Crime', 'Documentary', 'Animation', 'Musical', 'Western', 'War',
        'Biography', 'History', 'Family', 'Superhero', 'Indie Films', 'Foreign Films', 'Classic Cinema',
        'Marvel', 'DC Comics', 'Studio Ghibli', 'Disney', 'Pixar', 'Netflix Originals', 'Korean Cinema'
      ]
    },
    music: {
      icon: Music,
      tags: [
        'Pop', 'Rock', 'Hip Hop', 'R&B', 'Jazz', 'Classical', 'Electronic', 'Country',
        'Folk', 'Blues', 'Reggae', 'Punk', 'Metal', 'Alternative', 'Indie', 'Dance',
        'House', 'Techno', 'Dubstep', 'Ambient', 'World Music', 'Latin', 'K-Pop', 'J-Pop',
        'Acoustic', 'Instrumental', 'Opera', 'Musical Theatre', 'Lo-Fi', 'Synthwave'
      ]
    },
    hobbies: {
      icon: Palette,
      tags: [
        'Reading', 'Writing', 'Photography', 'Painting', 'Drawing', 'Cooking', 'Baking', 'Gardening',
        'Knitting', 'Sewing', 'Crafting', 'Woodworking', 'Pottery', 'Jewelry Making', 'Origami',
        'Chess', 'Board Games', 'Video Games', 'Puzzles', 'Collecting', 'Model Building', 'Dancing',
        'Singing', 'Playing Instruments', 'Blogging', 'Podcasting', 'Travel', 'Learning Languages', 'Meditation'
      ]
    },
    personality: {
      icon: Brain,
      tags: [
        'Ambitious', 'Creative', 'Analytical', 'Empathetic', 'Optimistic', 'Adventurous', 'Intellectual',
        'Humorous', 'Compassionate', 'Determined', 'Curious', 'Patient', 'Spontaneous', 'Organized',
        'Loyal', 'Independent', 'Sociable', 'Thoughtful', 'Confident', 'Gentle', 'Energetic', 'Calm',
        'Innovative', 'Reliable', 'Charismatic', 'Introspective', 'Passionate', 'Diplomatic', 'Resilient', 'Wise'
      ]
    }
  };

  const mbtiTypes = [
    {
      type: 'INTJ',
      name: 'The Architect',
      description: 'Imaginative and strategic thinkers, with a plan for everything. Independent, decisive, and highly ambitious.'
    },
    {
      type: 'INTP',
      name: 'The Thinker', 
      description: 'Innovative inventors with an unquenchable thirst for knowledge. Logical, flexible, and adaptable.'
    },
    {
      type: 'ENTJ',
      name: 'The Commander',
      description: 'Bold, imaginative, and strong-willed leaders. Natural-born leaders who are always finding ways to achieve their goals.'
    },
    {
      type: 'ENTP',
      name: 'The Debater',
      description: 'Smart and curious thinkers who cannot resist an intellectual challenge. Quick-witted and audacious.'
    },
    {
      type: 'INFJ',
      name: 'The Advocate',
      description: 'Quiet and mystical, yet very inspiring and tireless idealists. Creative, insightful, and passionate.'
    },
    {
      type: 'INFP',
      name: 'The Mediator',
      description: 'Poetic, kind, and altruistic people, always eager to help a good cause. True idealists and loyal.'
    },
    {
      type: 'ENFJ',
      name: 'The Protagonist',
      description: 'Charismatic and inspiring leaders, able to mesmerize their listeners. Natural-born teachers and mentors.'
    },
    {
      type: 'ENFP',
      name: 'The Campaigner',
      description: 'Enthusiastic, creative, and sociable free spirits. Always able to find a reason to smile.'
    },
    {
      type: 'ISTJ',
      name: 'The Logistician',
      description: 'Practical and fact-minded, reliable and responsible. Thorough, honest, and tradition-oriented.'
    },
    {
      type: 'ISFJ',
      name: 'The Protector',
      description: 'Warm-hearted and dedicated protectors, always ready to defend their loved ones. Kind and loyal.'
    },
    {
      type: 'ESTJ',
      name: 'The Executive',
      description: 'Excellent administrators, unsurpassed at managing things or people. Traditional and hardworking.'
    },
    {
      type: 'ESFJ',
      name: 'The Consul',
      description: 'Extraordinarily caring, social, and popular people, always eager to help. Warm-hearted and cooperative.'
    },
    {
      type: 'ISTP',
      name: 'The Virtuoso',
      description: 'Bold and practical experimenters, masters of all kinds of tools. Flexible and tolerant.'
    },
    {
      type: 'ISFP',
      name: 'The Adventurer',
      description: 'Flexible and charming artists, always ready to explore new possibilities. Gentle and passionate.'
    },
    {
      type: 'ESTP',
      name: 'The Entrepreneur',
      description: 'Smart, energetic, and perceptive people who truly enjoy living on the edge. Spontaneous and pragmatic.'
    },
    {
      type: 'ESFP',
      name: 'The Entertainer',
      description: 'Spontaneous, energetic, and enthusiastic people. Life is never boring around them. Fun-loving and people-focused.'
    }
  ];

  const handleFavoriteToggle = (tag: string) => {
    const currentFavorites = data.personalityTraits || [];
    const updatedFavorites = currentFavorites.includes(tag)
      ? currentFavorites.filter((fav: string) => fav !== tag)
      : currentFavorites.length < 25 
        ? [...currentFavorites, tag]
        : currentFavorites;
    onUpdate('personalityTraits', updatedFavorites);
  };

  return (
    <div className="space-y-6">
      {/* Pick Favorites Section */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Pick Favorites
          </CardTitle>
          <CardDescription>
            Select 5-25 tags that represent your avatar's interests and personality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Favorites Counter */}
          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
            <span className="text-sm font-medium">
              Selected: {data.personalityTraits?.length || 0} / 25
            </span>
            <Badge variant={data.personalityTraits?.length >= 5 ? "default" : "destructive"}>
              {data.personalityTraits?.length >= 5 ? "Minimum met" : `Need ${5 - (data.personalityTraits?.length || 0)} more`}
            </Badge>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-5">
              {Object.entries(tagCategories).map(([key, category]) => {
                const IconComponent = category.icon;
                return (
                  <TabsTrigger key={key} value={key} className="flex items-center gap-1">
                    <IconComponent className="h-3 w-3" />
                    <span className="capitalize hidden sm:inline">{key}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {Object.entries(tagCategories).map(([key, category]) => (
              <TabsContent key={key} value={key} className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {category.tags.map((tag) => {
                    const isSelected = data.personalityTraits?.includes(tag);
                    const canSelect = (data.personalityTraits?.length || 0) < 25;
                    return (
                      <Button
                        key={tag}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className="justify-start text-xs"
                        onClick={() => handleFavoriteToggle(tag)}
                        disabled={!isSelected && !canSelect}
                      >
                        {tag}
                      </Button>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Selected Favorites Display */}
          {data.personalityTraits && data.personalityTraits.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Selected Favorites:</h4>
              <div className="flex flex-wrap gap-2">
                {data.personalityTraits.map((favorite: string) => (
                  <Badge key={favorite} variant="secondary" className="cursor-pointer" onClick={() => handleFavoriteToggle(favorite)}>
                    {favorite} ×
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MBTI Selection */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Pick MBTI Type
          </CardTitle>
          <CardDescription>
            Choose the personality type that best represents your avatar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {mbtiTypes.map((mbti) => (
              <div
                key={mbti.type}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  data.mbtiType === mbti.type 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onUpdate('mbtiType', mbti.type)}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-lg">{mbti.type}</h4>
                    {data.mbtiType === mbti.type && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </div>
                  <h5 className="font-medium text-sm">{mbti.name}</h5>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {mbti.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
