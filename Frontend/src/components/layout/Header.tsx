import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Droplets } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/explore", label: "Explore Data" },
    { href: "/ask", label: "Ask AI" },
    { href: "/report", label: "Reports" },
    { href: "/about", label: "About" },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-gradient-water shadow-water">
            <Droplets className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
            HydroInsight
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <Button
              key={item.href}
              asChild
              variant={isActive(item.href) ? "default" : "ghost"}
              className={isActive(item.href) ? "bg-gradient-water text-white shadow-water" : ""}
            >
              <Link to={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <div className="flex flex-col space-y-4 mt-8">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  asChild
                  variant={isActive(item.href) ? "default" : "ghost"}
                  className={`justify-start ${
                    isActive(item.href) ? "bg-gradient-water text-white shadow-water" : ""
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Link to={item.href}>{item.label}</Link>
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;