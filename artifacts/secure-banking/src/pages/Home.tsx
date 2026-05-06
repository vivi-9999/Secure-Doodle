import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Lock, Key } from "lucide-react";
import { animate, stagger } from "animejs";
import { useEffect, useRef } from "react";
import { useGetMyProfile } from "@workspace/api-client-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const heroRef = useRef<HTMLDivElement>(null);
  
  const { data: user, isLoading } = useGetMyProfile();

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  useEffect(() => {
    if (heroRef.current) {
      animate('.hero-stagger', {
        translateY: [20, 0],
        opacity: [0, 1],
        delay: stagger(150),
        duration: 800,
        ease: 'easeOutCubic'
      });
    }
  }, [isLoading, user]);

  if (user) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden doodle-bg">
      <header className="border-b bg-card/50 backdrop-blur-md relative z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-xl">
            <Lock className="w-6 h-6" />
            <span>SecureBank</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" data-testid="link-login">Login</Button>
            </Link>
            <Link href="/register">
              <Button data-testid="link-register">Open Account</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-24 relative z-10" ref={heroRef}>
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="hero-stagger opacity-0 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent font-medium text-sm mb-4">
            <ShieldCheck className="w-4 h-4" />
            Military-grade encryption
          </div>
          
          <h1 className="hero-stagger opacity-0 text-5xl md:text-7xl font-bold tracking-tight text-primary">
            Banking built for the <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">paranoid</span>.
          </h1>
          
          <p className="hero-stagger opacity-0 text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            We take your money as seriously as you take your privacy. Zero-knowledge architecture, multi-factor authentication, and impenetrable infrastructure.
          </p>
          
          <div className="hero-stagger opacity-0 flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8" data-testid="btn-get-started">
                Get Started Securely
              </Button>
            </Link>
            <Link href="/admin/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8" data-testid="btn-admin-access">
                Admin Access
              </Button>
            </Link>
          </div>
        </div>

        <div className="hero-stagger opacity-0 grid md:grid-cols-3 gap-8 mt-32 max-w-5xl mx-auto">
          {[
            { icon: Lock, title: "256-bit Encryption", desc: "Your data is encrypted at rest and in transit." },
            { icon: Key, title: "Zero Trust", desc: "We don't trust anyone, not even ourselves. Your keys are yours alone." },
            { icon: ShieldCheck, title: "Fraud Protection", desc: "AI-driven anomaly detection stops threats before they happen." }
          ].map((feature, i) => (
            <div key={i} className="bg-card p-6 rounded-xl border shadow-sm flex flex-col items-center text-center group hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
