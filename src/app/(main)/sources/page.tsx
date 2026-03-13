'use client';

import React from 'react';

/**
 * Sources Page
 * 
 * Lists all icons, images, and research sources used in the application
 * with proper attribution.
 */
export default function SourcesPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-bold tracking-tight mb-4">
              <span className="bg-gradient-to-r from-[#a855f7] to-[#ec4899] bg-clip-text text-transparent">
                Sources & Attribution
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Icons, images, and research sources used in this application
            </p>
          </div>

          {/* Icons Section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Icons
            </h2>
            <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-6 backdrop-blur-md">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Heroicons</h3>
                  <p className="text-gray-400 mb-2">
                    All SVG icons used throughout the application are from Heroicons.
                  </p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>License: MIT</li>
                    <li>Website: <a href="https://heroicons.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">heroicons.com</a></li>
                    <li>GitHub: <a href="https://github.com/tailwindlabs/heroicons" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">tailwindlabs/heroicons</a></li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-zinc-700/30">
                  <p className="text-sm text-gray-500">
                    Icons are used inline as SVG elements throughout the application for navigation, buttons, status indicators, and UI elements.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Images Section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Images
            </h2>
            <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-6 backdrop-blur-md">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">User-Uploaded Content</h3>
                  <p className="text-gray-400 mb-2">
                    All item photos and school logos are uploaded by users and stored in Supabase Storage.
                  </p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Item photos: Stored in private bucket `item-photos`</li>
                    <li>School logos: Stored in `school-logos` bucket (if implemented)</li>
                    <li>All user-uploaded content is the property of the uploading user/school</li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-zinc-700/30">
                  <h3 className="text-lg font-semibold text-white mb-2">Placeholder Images</h3>
                  <p className="text-gray-400 mb-2">
                    Placeholder images may be used during development and testing.
                  </p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>via.placeholder.com - Used for development placeholders</li>
                    <li>License: Free for development use</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Research Sources Section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Research Sources
            </h2>
            <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-6 backdrop-blur-md">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Technology Stack Research</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                    <li>
                      <strong>Supabase Documentation</strong>
                      <br />
                      <span className="text-gray-400">Official documentation for database, storage, and authentication features</span>
                      <br />
                      <a href="https://supabase.com/docs" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline text-sm">supabase.com/docs</a>
                    </li>
                    <li>
                      <strong>Clerk Documentation</strong>
                      <br />
                      <span className="text-gray-400">Authentication and organization management documentation</span>
                      <br />
                      <a href="https://clerk.com/docs" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline text-sm">clerk.com/docs</a>
                    </li>
                    <li>
                      <strong>Next.js Documentation</strong>
                      <br />
                      <span className="text-gray-400">Server actions, routing, and React Server Components</span>
                      <br />
                      <a href="https://nextjs.org/docs" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline text-sm">nextjs.org/docs</a>
                    </li>
                    <li>
                      <strong>PostgreSQL Row Level Security</strong>
                      <br />
                      <span className="text-gray-400">PostgreSQL documentation on RLS policies and security</span>
                      <br />
                      <a href="https://www.postgresql.org/docs/current/ddl-rowsecurity.html" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline text-sm">postgresql.org/docs</a>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-zinc-700/30">
                  <h3 className="text-lg font-semibold text-white mb-2">Security Best Practices</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                    <li>
                      <strong>OWASP Top 10</strong>
                      <br />
                      <span className="text-gray-400">Web application security best practices</span>
                      <br />
                      <a href="https://owasp.org/www-project-top-ten/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline text-sm">owasp.org</a>
                    </li>
                    <li>
                      <strong>Supabase Security Guide</strong>
                      <br />
                      <span className="text-gray-400">Best practices for securing Supabase applications</span>
                      <br />
                      <a href="https://supabase.com/docs/guides/auth/row-level-security" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline text-sm">supabase.com/docs/guides/auth/row-level-security</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Libraries & Frameworks Section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Libraries & Frameworks
            </h2>
            <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-6 backdrop-blur-md">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Open Source Dependencies</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-300 mb-2">Frontend</h4>
                      <ul className="list-disc list-inside text-gray-400 space-y-1 text-sm ml-4">
                        <li>Next.js (MIT)</li>
                        <li>React (MIT)</li>
                        <li>Tailwind CSS (MIT)</li>
                        <li>TypeScript (Apache 2.0)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-300 mb-2">Backend & Services</h4>
                      <ul className="list-disc list-inside text-gray-400 space-y-1 text-sm ml-4">
                        <li>Supabase (Apache 2.0)</li>
                        <li>Clerk (Proprietary)</li>
                        <li>@supabase/ssr (MIT)</li>
                        <li>@supabase/supabase-js (MIT)</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-zinc-700/30">
                  <p className="text-sm text-gray-500">
                    All open source dependencies are listed in <code className="bg-zinc-900/50 px-2 py-1 rounded text-purple-300">package.json</code> with their respective licenses.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm mt-12">
            <p>This page lists all sources, attributions, and research materials used in the Reclaim application.</p>
            <p className="mt-2">For questions or concerns about attribution, please contact the development team.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
