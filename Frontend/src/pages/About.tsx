import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Users, Database, Zap } from "lucide-react";

const About = () => {
  const features = [
    {
      icon: Database,
      title: "Comprehensive Data",
      description: "Access to 50,000+ water level records across 28 states and 700+ districts"
    },
    {
      icon: Zap,
      title: "AI-Powered Insights",
      description: "Get instant answers and analysis from our intelligent knowledge base"
    },
    {
      icon: Target,
      title: "Precision Monitoring",
      description: "Pre and post-monsoon measurements for accurate seasonal analysis"
    },
    {
      icon: Users,
      title: "Community Focus",
      description: "Supporting community participation in groundwater management"
    }
  ];

  const objectives = [
    "Strengthen institutional framework for groundwater management",
    "Create sustainable financing mechanisms for groundwater management",
    "Increase community participation in water conservation",
    "Improve monitoring and data management systems",
    "Enhance water use efficiency through demand-side interventions"
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-ocean bg-clip-text text-transparent">
          About Atal Bhujal
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          The Atal Bhujal Yojana is a central sector scheme aimed at sustainable groundwater management 
          through community participation with an emphasis on demand-side interventions.
        </p>
      </div>

      {/* Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Project Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="text-muted-foreground mb-4">
              The Atal Bhujal Yojana (ATAL JAL) is implemented with World Bank assistance in Gujarat, 
              Haryana, Karnataka, Madhya Pradesh, Maharashtra, Rajasthan, and Uttar Pradesh. The scheme 
              focuses on sustainable groundwater management through community participation with emphasis 
              on demand-side interventions.
            </p>
            <p className="text-muted-foreground">
              HydroInsight provides a comprehensive platform to explore groundwater data, generate insights, 
              and support informed decision-making for water resource management under this initiative.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {features.map((feature, index) => (
          <Card key={index} className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 mx-auto mb-4 p-3 rounded-lg bg-gradient-water shadow-water">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Objectives */}
        <Card>
          <CardHeader>
            <CardTitle>Key Objectives</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {objectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Badge variant="secondary" className="mt-0.5 text-xs">
                    {index + 1}
                  </Badge>
                  <span className="text-sm">{objective}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Implementation */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation States</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                "Gujarat", "Haryana", "Karnataka", "Madhya Pradesh",
                "Maharashtra", "Rajasthan", "Uttar Pradesh"
              ].map((state) => (
                <div key={state} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-sm">{state}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Program Duration</h4>
              <p className="text-sm text-muted-foreground">
                2020-2025 (5 years) with a total outlay of ₹6,000 crores
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Learn More</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Ministry of Jal Shakti</h4>
              <p className="text-sm text-muted-foreground">
                Department of Water Resources, River Development & Ganga Rejuvenation
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Technical Support</h4>
              <p className="text-sm text-muted-foreground">
                Central Ground Water Board (CGWB)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default About;