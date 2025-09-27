import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Check, 
  ArrowLeft,
  Sparkles,
  Users,
  Building
} from 'lucide-react';

const BillingSection = () => {
  const [showPricing, setShowPricing] = useState(false);

  if (showPricing) {
    return <PricingPage onBack={() => setShowPricing(false)} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Billing & Plans</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-green-600">Starter (Monthly)</h3>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setShowPricing(true)}
              >
                Change plan
              </Button>
              <Button variant="outline" size="sm">
                Cancel plan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 text-muted-foreground font-medium">Date</th>
                  <th className="text-left py-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-right py-3 text-muted-foreground font-medium">Amount Due</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                <tr className="border-b">
                  <td className="py-4 text-muted-foreground">09 August, 2025</td>
                  <td className="py-4">
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
                      Completed
                    </Badge>
                  </td>
                  <td className="py-4 text-right text-muted-foreground">USD 25.92</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 text-muted-foreground">09 July, 2025</td>
                  <td className="py-4">
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
                      Completed
                    </Badge>
                  </td>
                  <td className="py-4 text-right text-muted-foreground">USD 25.92</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 text-muted-foreground">09 June, 2025</td>
                  <td className="py-4">
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
                      Completed
                    </Badge>
                  </td>
                  <td className="py-4 text-right text-muted-foreground">USD 25.92</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" disabled>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button variant="default" size="sm" className="bg-primary text-primary-foreground">
                1
              </Button>
              <Button variant="ghost" size="sm" disabled>
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">VISA</span>
              </div>
              <div>
                <p className="font-medium">Visa ending in 6661</p>
                <p className="text-sm text-muted-foreground">Expires May, 2032</p>
              </div>
            </div>
            <Button variant="default" size="sm">
              Change payment method
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const PricingPage = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="shrink-0 hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Pricing</h1>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center mb-10">
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12 text-sm font-medium">
            <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
              <div className="w-5 h-5 rounded-full border-2 border-primary/60 flex items-center justify-center bg-primary/10">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              </div>
              <span>24/7 support</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
              <div className="w-5 h-5 rounded-full border-2 border-primary/60 flex items-center justify-center bg-primary/10">
                <Check className="w-3 h-3 text-primary" />
              </div>
              <span>30-day money-back guarantee</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
              <div className="w-5 h-5 rounded-full border-2 border-primary/60 flex items-center justify-center bg-primary/10">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              </div>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          {/* Starter Plan */}
          <div className="relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
              <Badge className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-6 py-2 font-semibold text-sm shadow-lg border-0">
                MOST POPULAR
              </Badge>
            </div>
            <Card className="relative h-full border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-lg"></div>
              <CardHeader className="relative text-center pt-8 pb-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-sm font-bold text-muted-foreground tracking-wider">STARTER</div>
                  <Badge variant="secondary" className="bg-gradient-to-r from-primary/20 to-primary/30 text-primary border-0 font-semibold px-3 py-1">
                    30% OFF
                  </Badge>
                </div>
                
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-3xl font-bold text-foreground">2 Avatar IP</span>
                </div>
                
                <p className="text-muted-foreground mb-8 leading-relaxed px-4">
                  Great for students, beginners, and enthusiasts to get started.
                </p>
                
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground line-through">RM 999</div>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-foreground">RM 588</span>
                    <span className="text-xl text-muted-foreground font-medium">/mo</span>
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed px-2">
                    Get 12 months for RM 4939.20 (regular price RM 7056). Renews at RM 588/mo.
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative pt-0 pb-8">
                <Button className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
                  Select plan
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Hobbyist Plan */}
          <Card className="h-full border border-border/50 bg-card shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="text-center pt-8 pb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm font-bold text-muted-foreground tracking-wider">HOBBYIST/SMALL TEAM</div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold px-3 py-1">
                  29% OFF
                </Badge>
              </div>
              
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-blue-50 border border-blue-200">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-3xl font-bold text-foreground">10 Avatar IP</span>
              </div>
              
              <p className="text-muted-foreground mb-8 leading-relaxed px-4">
                Ideal for freelancers and creators to turn ideas into side hustles.
              </p>
              
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground line-through">RM 243.99</div>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-foreground">RM 2288</span>
                  <span className="text-xl text-muted-foreground font-medium">/mo</span>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed px-2">
                  Get 12 months for RM 19,493.76 (regular price RM 27,456). Renews at RM 2288/mo.
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-8">
              <Button variant="outline" className="w-full h-12 text-base font-semibold border-2 hover:bg-muted/50 transition-all duration-300">
                Select plan
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="h-full border border-border/50 bg-card shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="text-center pt-8 pb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm font-bold text-muted-foreground tracking-wider">ENTERPRISE</div>
                <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 font-semibold px-3 py-1">
                  20% OFF
                </Badge>
              </div>
              
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-purple-50 border border-purple-200">
                  <Building className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-3xl font-bold text-foreground">Unlimited Avatar IP</span>
              </div>
              
              <p className="text-muted-foreground mb-8 leading-relaxed px-4">
                Built for startups, teams, and innovators seeking more flexibility.
              </p>
              
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground line-through">RM 434.99</div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-foreground mb-2">Flexible Plans</div>
                  <div className="text-sm text-muted-foreground font-medium">Custom Plans</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-8">
              <Button variant="outline" className="w-full h-12 text-base font-semibold border-2 hover:bg-muted/50 transition-all duration-300">
                Select plan
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <Card className="border-0 bg-gradient-to-br from-muted/30 to-background shadow-2xl">
          <CardHeader className="text-center py-8">
            <CardTitle className="text-2xl lg:text-3xl font-bold leading-tight">
              Every plan has <span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">everything you need</span> and more
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="grid lg:grid-cols-3 gap-8 lg:gap-10">
              <div className="space-y-4">
                <FeatureItem text="KnowledgeBase Training" isNew />
                <FeatureItem text="Whatsapp Integration" />
                <FeatureItem text="Telegram Integration" />
                <FeatureItem text="Unlimited Workflow Call" />
                <FeatureItem text="Context Engineer Memory" />
              </div>
              <div className="space-y-4">
                <FeatureItem text="Hosting" isFree />
                <FeatureItem text="IP Management" />
                <FeatureItem text="Unlimited Version Control" />
                <FeatureItem text="Daily backups" />
                <FeatureItem text="GraphRAG Integration" />
              </div>
              <div className="space-y-4">
                <FeatureItem text="Supabase integration" />
                <FeatureItem text="Auto error fixer" />
                <FeatureItem text="Code editor" />
                <FeatureItem text="24/7 customer support" />
                <FeatureItem text="30-Day money-back guarantee" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const FeatureItem = ({ text, isNew = false, isFree = false }: { 
  text: string; 
  isNew?: boolean; 
  isFree?: boolean; 
}) => (
  <div className="flex items-center gap-4 group">
    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-100 to-green-200 border border-green-300/50 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-all duration-300">
      <Check className="w-4 h-4 text-green-700" />
    </div>
    <span className="text-base font-medium text-foreground group-hover:text-primary transition-colors duration-300">{text}</span>
    {isNew && (
      <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300 text-xs font-semibold px-3 py-1 shadow-sm">
        NEW
      </Badge>
    )}
    {isFree && (
      <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300 text-xs font-semibold px-3 py-1 shadow-sm">
        1 YEAR FREE
      </Badge>
    )}
  </div>
);

export default BillingSection;