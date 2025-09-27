import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ShoppingBag,
  Star,
  DollarSign,
  Search,
  Filter,
  SlidersHorizontal,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMarketplace } from '@/hooks/useMarketplace';
import { useNavigate } from 'react-router-dom';

const MarketplaceSection = () => {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    avatars,
    categories,
    purchasedAvatars,
    isLoading,
    error,
    handlePurchaseAvatar,
    isPurchasing
  } = useMarketplace();

  const handleViewAvatar = (avatarId: string) => {
    navigate(`/avatar/${avatarId}`);
  };

  const priceRanges = [
    { label: 'All Prices', value: 'all' },
    { label: 'Under $100', value: 'under100' },
    { label: '$100 - $150', value: '100-150' },
    { label: '$150+', value: 'over150' }
  ];

  const filteredAvatars = avatars.filter(avatar => {
    const matchesCategory = filter === 'all' || avatar.category === filter;
    const matchesSearch = avatar.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         avatar.personality.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         avatar.description.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesPrice = true;
    if (priceRange === 'under100') matchesPrice = avatar.price < 100;
    else if (priceRange === '100-150') matchesPrice = avatar.price >= 100 && avatar.price <= 150;
    else if (priceRange === 'over150') matchesPrice = avatar.price > 150;

    return matchesCategory && matchesSearch && matchesPrice;
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading marketplace...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Failed to load marketplace data</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingBag className="h-6 w-6" />
              Avatar Marketplace
            </h1>
            <p className="text-sm text-muted-foreground">
              Discover and purchase AI avatars created by the community
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-card rounded-lg p-4 border space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search avatars by name, personality, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-medium">Category Filters:</span>
            </div>
            
            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={filter === category ? "default" : "outline"}
                  size="sm"
                  className="text-sm px-4 py-2 h-8 mx-1"
                  onClick={() => setFilter(category)}
                >
                  {category === 'all' ? 'All' : category}
                </Button>
              ))}
            </div>

            {/* Price Filter */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">Price Filters:</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {priceRanges.map((range) => (
                  <Button
                    key={range.value}
                    variant={priceRange === range.value ? "default" : "outline"}
                    size="sm"
                    className="text-sm px-4 py-2 h-8 mx-1"
                    onClick={() => setPriceRange(range.value)}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredAvatars.length} avatar{filteredAvatars.length !== 1 ? 's' : ''}
      </div>

      {/* Avatar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAvatars.map((avatar) => (
          <Card 
            key={avatar.id} 
            className="card-modern overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] max-w-sm"
            onClick={() => handleViewAvatar(avatar.id)}
          >
            {/* Avatar Image */}
            <div className="relative aspect-[3/4] overflow-hidden">
              <img
                src={avatar.image_url || '/placeholder-avatar.png'}
                alt={avatar.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="text-sm px-2 py-1">
                  {avatar.category}
                </Badge>
              </div>
              {purchasedAvatars.includes(avatar.id) && (
                <div className="absolute top-2 left-2">
                  <Badge variant="default" className="text-sm px-2 py-1 bg-green-600">
                    Owned
                  </Badge>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <h3 className="text-white font-semibold text-base mb-1">{avatar.name}</h3>
                <div className="flex items-center gap-1 text-sm text-white/80 mb-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span>{avatar.rating}</span>
                  <span>•</span>
                  <span>{avatar.total_sales} sales</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-white" />
                    <span className="font-bold text-white text-base">${avatar.price}</span>
                  </div>
                  <Badge variant="outline" className="text-sm border-white/50 text-white bg-white/10">
                    {avatar.mbti}
                  </Badge>
                </div>
              </div>
            </div>
            
            <CardContent className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {avatar.description}
              </p>
              
              {/* Personality Badges */}
              <div className="flex flex-wrap gap-1">
                {avatar.personality.slice(0, 3).map((trait) => (
                  <Badge key={trait} variant="secondary" className="text-sm px-2 py-1">
                    {trait}
                  </Badge>
                ))}
                {avatar.personality.length > 3 && (
                  <Badge variant="outline" className="text-sm px-2 py-1">
                    +{avatar.personality.length - 3}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-muted-foreground">
                  {avatar.languages.slice(0, 2).join(', ')}
                  {avatar.languages.length > 2 && ' +'}
                </div>
                <div className="text-base font-bold text-black">
                  ${avatar.price}
                </div>
              </div>

              {!purchasedAvatars.includes(avatar.id) && (
                <Button
                  className="w-full mt-2"
                  disabled={isPurchasing}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePurchaseAvatar(avatar.id, avatar.name);
                  }}
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Purchasing...
                    </>
                  ) : (
                    'Purchase'
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAvatars.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No avatars found matching your criteria.</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => {
              setFilter('all');
              setSearchQuery('');
              setPriceRange('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default MarketplaceSection;
