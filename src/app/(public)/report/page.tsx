import ReportItemForm from '@/components/forms/ReportItemForm';

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-black text-white">
        <div className="px-6 py-16">
          {/* Enhanced Header */}
          <div className="mb-16 text-center relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 blur-3xl -z-10"></div>
            <div className="relative">
              <h1 className="text-6xl font-bold tracking-tight mb-6">
                <span className="bg-gradient-to-r from-[#a855f7] to-[#ec4899] bg-clip-text text-transparent">
                Report an Item
                </span>
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                Help reunite lost items with their owners by providing detailed information below
              </p>
            </div>
          </div>

          {/* Main Content Layout */}
          <div className="flex justify-center">
            <div className="w-full max-w-7xl">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                {/* Form Section */}
                <div className="xl:col-span-2">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl rounded-2xl -z-10"></div>
                <ReportItemForm />
                  </div>
                </div>

                {/* Tips Section */}
                <div className="xl:col-span-1">
                  <div className="sticky top-8">
                    {/* Quick Stats */}
                    <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl p-6 mb-6 backdrop-blur-md">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        Success Rate
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">85%</div>
                          <div className="text-xs text-gray-400">Items Found</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">3.2</div>
                          <div className="text-xs text-gray-400">Days Avg</div>
                        </div>
                      </div>
              </div>

                    {/* Tips Card */}
                    <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl p-6 backdrop-blur-md shadow-2xl">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                        <h2 className="text-lg font-semibold text-white">Reporting Tips</h2>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed">Add clear photos so items can be identified quickly.</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed">Use simple, descriptive titles.</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  </div>
                          <p className="text-gray-300 text-sm leading-relaxed">Include specific location details.</p>
                    </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                    </div>
                          <p className="text-gray-300 text-sm leading-relaxed">Add relevant tags for better searchability.</p>
                    </div>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
