"use client";

import { Mail, Phone, MapPin, Send, Globe, Heart, Pen } from "lucide-react";

const quickLinks = [
  { label: "About", href: "#about" },
  { label: "Programs", href: "#hero" },
  { label: "Teachers", href: "#teachers" },
  { label: "Brilliant Students", href: "#students" },
  { label: "Contact", href: "#footer" },
];

const phoneNumbers = [
  { label: "0331-0457545", href: "tel:03310457545" },
  { label: "0309-6336397", href: "tel:03096336397" },
  { label: "0309-4819094", href: "tel:03094819094" },
];

const socialIcons = [
  { icon: Send, label: "Send", href: "#" },
  { icon: Globe, label: "Globe", href: "#" },
  { icon: Heart, label: "Heart", href: "#" },
];

export default function Footer() {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer id="footer" className="relative border-t border-white/10 bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-16">
        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1 - Academy Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Pen className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-white">
                Nouman Science Academy
              </h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Dedicated to nurturing scientific curiosity and academic excellence
              in the next generation of innovators and researchers.
            </p>
          </div>

          {/* Column 2 - Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="text-muted-foreground hover:text-primary transition-colors duration-300 text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Contact Info */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <a
                  href="mailto:nomanschool11@gmail.com"
                  className="text-muted-foreground hover:text-primary transition-colors duration-300 text-sm"
                >
                  nomanschool11@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="flex flex-col gap-1">
                  {phoneNumbers.map((phone) => (
                    <a
                      key={phone.href}
                      href={phone.href}
                      className="text-muted-foreground hover:text-primary transition-colors duration-300 text-sm"
                    >
                      {phone.label}
                    </a>
                  ))}
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-muted-foreground text-sm">
                  Rana Super Store, near Peer Bazar, Green Town, Lahore
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4 - Connect */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Connect</h3>
            <div className="flex items-center gap-3">
              {socialIcons.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary/10 text-muted-foreground hover:bg-primary/20 hover:text-primary transition-all duration-300 hover:scale-110"
                    aria-label={social.label}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Copyright */}
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <p className="text-center text-muted-foreground text-sm">
          &copy; 2026 Nouman Science Academy. All rights reserved.
        </p>
      </div>
    </footer>
  );
}