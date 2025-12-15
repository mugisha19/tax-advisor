import React from "react";
import { Heart, Github, Linkedin, Twitter, Mail } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-gray-300 border-t border-slate-700">
      <div className="container mx-auto px-6 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* About Section */}
          <div>
            <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <span className="bg-gradient-to-r from-blue-400 to-blue-600 text-white px-3 py-1 rounded-lg text-sm">
                RRA
              </span>
              Tax Professional System
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Rwanda Revenue Authority's comprehensive tax professional
              management platform for streamlined application processing and
              document verification.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-3">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/dashboard"
                  className="hover:text-blue-400 transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full group-hover:w-2 transition-all"></span>
                  Dashboard
                </a>
              </li>
              <li>
                <a
                  href="/officer/review"
                  className="hover:text-blue-400 transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full group-hover:w-2 transition-all"></span>
                  Applications
                </a>
              </li>
              <li>
                <a
                  href="/officer/my-reviews"
                  className="hover:text-blue-400 transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full group-hover:w-2 transition-all"></span>
                  My Reviews
                </a>
              </li>
              <li>
                <a
                  href="/officers"
                  className="hover:text-blue-400 transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full group-hover:w-2 transition-all"></span>
                  Officers
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-3">
              Contact & Support
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:support@rra.gov.rw"
                  className="hover:text-blue-400 transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  support@rra.gov.rw
                </a>
              </li>
              <li className="text-gray-400">
                <span className="font-medium text-white">Phone:</span> +250 788
                123 456
              </li>
              <li className="text-gray-400">
                <span className="font-medium text-white">Hours:</span> Mon-Fri,
                8:00 AM - 5:00 PM
              </li>
            </ul>

            {/* Social Links */}
            <div className="flex gap-3 mt-4">
              <a
                href="https://twitter.com/RRARwanda"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-slate-700 hover:bg-blue-500 rounded-full flex items-center justify-center transition-colors group"
                title="Twitter"
              >
                <Twitter className="w-4 h-4 text-gray-300 group-hover:text-white" />
              </a>
              <a
                href="https://linkedin.com/company/rra-rwanda"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-slate-700 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors group"
                title="LinkedIn"
              >
                <Linkedin className="w-4 h-4 text-gray-300 group-hover:text-white" />
              </a>
              <a
                href="https://github.com/rra-rwanda"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-slate-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors group"
                title="GitHub"
              >
                <Github className="w-4 h-4 text-gray-300 group-hover:text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700 pt-6">
          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-400 text-center md:text-left">
              <span className="flex items-center gap-2 justify-center md:justify-start">
                &copy; {currentYear} Rwanda Revenue Authority. All rights
                reserved.
              </span>
            </div>

            <div className="flex items-center gap-1 text-sm text-gray-400">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
              <span>for Rwanda</span>
            </div>

            <div className="flex gap-4 text-sm">
              <a
                href="/privacy-policy"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                Privacy Policy
              </a>
              <span className="text-gray-600">|</span>
              <a
                href="/terms"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Bottom Border */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500"></div>
    </footer>
  );
};

export default Footer;
