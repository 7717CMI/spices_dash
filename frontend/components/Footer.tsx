'use client'

import { Phone, Mail, MapPin, Linkedin, Facebook } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      {/* Top Contact Bar */}
      <div className="bg-gray-700 border-b border-gray-600">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="text-sm font-medium">Contact Us</div>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-300" />
                <span className="text-xs text-gray-300">United States:</span>
                <span className="text-sm font-medium">+1-252-477-1362</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-300" />
                <span className="text-xs text-gray-300">United Kingdom:</span>
                <span className="text-sm font-medium">+44-203-957-8553 / +44-203-949-5508</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-300" />
                <span className="text-xs text-gray-300">Australia:</span>
                <span className="text-sm font-medium">+61-8-7924-7805</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-300" />
                <span className="text-xs text-gray-300">India:</span>
                <span className="text-sm font-medium">+91-848-285-0837</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Contact Details Column */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">For Business Enquiry :</h3>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href="mailto:sales@coherentmarketinsights.com" className="text-gray-300 hover:text-white">
                  sales@coherentmarketinsights.com
                </a>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Sales Office (U.S.) :</h3>
              <div className="flex items-start gap-2 text-sm text-gray-300">
                <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  Coherent Market Insights Pvt Ltd,<br />
                  533 Airport Boulevard, Suite 400,<br />
                  Burlingame, CA 94010, United States
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-dashed border-gray-600">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Asia Pacific Intelligence Center (India) :</h3>
              <div className="flex items-start gap-2 text-sm text-gray-300">
                <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  Coherent Market Insights Pvt Ltd,<br />
                  401-402, Bremen Business Center,<br />
                  University Road, Aundh,<br />
                  Pune – 411007, India.
                </div>
              </div>
            </div>
          </div>

          {/* Menu Column */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Menu</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Industries</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Services</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Careers</a></li>
            </ul>
          </div>

          {/* Reader Club Column */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Reader Club</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Latest Insights</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Press Release</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Infographics</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Blogs</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">News</a></li>
            </ul>
          </div>

          {/* Help & Social Column */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Help</h3>
            <ul className="space-y-2 mb-6">
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Become Reseller</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">How To Order?</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Terms and Conditions</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Disclaimer</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Sitemap</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Feeds</a></li>
            </ul>

            {/* Social Media */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Connect With Us :</h3>
              <div className="flex gap-2">
                <a 
                  href="#" 
                  className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center transition-colors"
                  aria-label="Twitter"
                >
                  <span className="text-lg font-bold">X</span>
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center transition-colors"
                  aria-label="Pinterest"
                >
                  <span className="text-lg font-bold">P</span>
                </a>
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Secure Payment By :</h3>
              <div className="flex gap-2 flex-wrap">
                <div className="px-3 py-2 bg-white rounded text-gray-800 text-xs font-semibold">VISA</div>
                <div className="px-3 py-2 bg-white rounded text-gray-800 text-xs font-semibold">DISCOVER</div>
                <div className="px-3 py-2 bg-white rounded text-gray-800 text-xs font-semibold">MasterCard</div>
                <div className="px-3 py-2 bg-white rounded text-gray-800 text-xs font-semibold">AMEX</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-gray-700 bg-gray-900">
        <div className="container mx-auto px-6 py-4">
          <p className="text-center text-sm text-gray-400">
            © 2025 Coherent Market Insights Pvt Ltd. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

