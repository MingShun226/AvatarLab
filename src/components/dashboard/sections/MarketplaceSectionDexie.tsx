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
  SlidersHorizontal
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useMarketplace, usePurchases } from '@/hooks/useDexieDatabase';
import { useAuth } from '@/hooks/useAuth';

const MarketplaceSectionDexie = () => {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Use new Dexie database hooks
  const { user } = useAuth();
  const { marketplaceAvatars, loading: marketplaceLoading } = useMarketplace();
  const { purchasedAvatars, purchaseAvatar, loading: purchaseLoading, isPurchased } = usePurchases(user?.id);

  const handleViewAvatar = (avatarId: string) => {
    navigate(`/avatar/${avatarId}`);
  };

  const handlePurchaseAvatar = async (avatarId: string, avatarName: string, price: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase avatars.",
        variant: "destructive"
      });
      return;
    }

    if (!isPurchased(avatarId)) {
      const success = await purchaseAvatar(avatarId, price);

      if (success) {
        toast({
          title: "Purchase Successful! 🎉",
          description: `You have successfully purchased ${avatarName}. You can now use this avatar in your projects.`,
        });
      } else {
        toast({
          title: "Purchase Failed",
          description: "There was an error processing your purchase. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  // Filter avatars based on search and filters
  const filteredAvatars = marketplaceAvatars.filter(avatar => {
    // Category filter
    if (filter !== 'all' && avatar.creator_studio &&
        !avatar.creator_studio.toLowerCase().includes(filter.toLowerCase())) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = avatar.name.toLowerCase().includes(query);
      const descMatch = avatar.description?.toLowerCase().includes(query);
      const traitsMatch = avatar.personality_traits?.some(trait =>
        trait.toLowerCase().includes(query)
      );
      const mbtiMatch = avatar.mbti_type?.toLowerCase().includes(query);

      if (!nameMatch && !descMatch && !traitsMatch && !mbtiMatch) {
        return false;
      }
    }

    // Price range filter
    if (priceRange !== 'all') {
      if (priceRange === 'free' && avatar.price > 0) return false;
      if (priceRange === 'under50' && (avatar.price <= 0 || avatar.price >= 50)) return false;
      if (priceRange === 'under100' && (avatar.price <= 0 || avatar.price >= 100)) return false;
      if (priceRange === 'premium' && avatar.price < 100) return false;
    }

    return true;
  });

  if (marketplaceLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Avatar Marketplace</h2>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          {filteredAvatars.length} avatars
        </Badge>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search avatars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-input bg-background rounded-md"
        >
          <option value="all">All Categories</option>
          <option value="kids">Kids</option>
          <option value="business">Business</option>
          <option value="lifestyle">Lifestyle</option>
          <option value="technology">Technology</option>
          <option value="art">Art</option>
          <option value="fashion">Fashion</option>
          <option value="fitness">Fitness</option>
          <option value="wellness">Wellness</option>
          <option value="adventure">Adventure</option>
          <option value="music">Music</option>
        </select>

        <select
          value={priceRange}
          onChange={(e) => setPriceRange(e.target.value)}
          className="px-3 py-2 border border-input bg-background rounded-md"
        >
          <option value="all">All Prices</option>
          <option value="free">Free</option>
          <option value="under50">Under $50</option>
          <option value="under100">Under $100</option>
          <option value="premium">Premium ($100+)</option>
        </select>
      </div>

      {/* Avatar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAvatars.map((avatar) => (
          <Card key={avatar.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-0">
              {/* Avatar Image */}
              <div className="relative overflow-hidden rounded-t-lg">
                <img
                  src={avatar.avatar_images?.[0] || '/placeholder-avatar.png'}
                  alt={avatar.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                />
                {isPurchased(avatar.id!) && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="default" className="bg-green-500">
                      Owned
                    </Badge>
                  </div>
                )}
              </div>

              {/* Avatar Info */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{avatar.name}</h3>
                    <p className="text-sm text-muted-foreground">by {avatar.creator_studio}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">4.8</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{avatar.total_sales} sales</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {avatar.description}
                </p>

                {/* MBTI and Traits */}
                <div className="flex items-center gap-2 flex-wrap">
                  {avatar.mbti_type && (
                    <Badge variant="outline" className="text-xs">
                      {avatar.mbti_type}
                    </Badge>
                  )}
                  {avatar.personality_traits?.slice(0, 2).map((trait: string) => (
                    <Badge key={trait} variant="secondary" className="text-xs">
                      {trait}
                    </Badge>
                  ))}
                </div>

                {/* Price and Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-bold text-green-600">
                      ${avatar.price.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewAvatar(avatar.id!)}
                    >
                      View
                    </Button>

                    {!isPurchased(avatar.id!) ? (
                      <Button
                        size="sm"
                        onClick={() => handlePurchaseAvatar(avatar.id!, avatar.name, avatar.price)}
                        disabled={purchaseLoading}
                      >
                        {purchaseLoading ? 'Purchasing...' : 'Buy Now'}
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" disabled>
                        Owned
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAvatars.length === 0 && (
        <div className="text-center py-12">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No avatars found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default MarketplaceSectionDexie;