import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Search, BarChart3, FileText, Database } from "lucide-react";
import heroImage from "@/assets/hero-groundwater.jpg";

const Home = () => {
  const features = [
    {
      icon: Database,
      title: "Explore Water Data",
      description: "Access comprehensive groundwater level data across India",
      href: "/explore",
    },
    {
      icon: Search,
      title: "Ask AI Assistant",
      description: "Get instant answers from our knowledge base",
      href: "/ask",
    },
    {
      icon: FileText,
      title: "Generate Reports",
      description: "Create detailed groundwater analysis reports",
      href: "/report",
    },
    {
      icon: BarChart3,
      title: "Data Visualization",
      description: "Interactive charts and insights",
      href: "/explore",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-ocean opacity-90" />
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative container mx-auto px-4 text-center text-white">
          <h1 className="text-4xl lg:text-6xl font-bold mb-6">
            Atal Bhujal
            <span className="block text-accent">Groundwater Insights</span>
          </h1>
          <p className="text-xl lg:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Explore India's groundwater data, get AI-powered insights, and generate comprehensive reports for informed water management decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-glow">
              <Link to="/explore">Explore Data</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-white text-primary hover:bg-white/90 shadow-glow">
              <Link to="/ask">Ask AI</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-ocean bg-clip-text text-transparent">
              Powerful Water Data Tools
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Access comprehensive groundwater data and analytics to make informed decisions about water resource management.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-water transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 p-3 rounded-lg bg-gradient-water shadow-water">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <Button asChild variant="ghost" className="group-hover:text-primary">
                    <Link to={feature.href}>Learn More →</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">50,000+</div>
              <div className="text-muted-foreground">Water Level Records</div>
            </div>
            <div>
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">28</div>
              <div className="text-muted-foreground">States Covered</div>
            </div>
            <div>
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">700+</div>
              <div className="text-muted-foreground">Districts Monitored</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;