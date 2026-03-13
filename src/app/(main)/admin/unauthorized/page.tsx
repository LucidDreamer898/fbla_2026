import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

/**
 * Access Restricted Page
 * 
 * This page is shown to users who attempt to access the admin panel
 * but do not have the required "admin" role in their organization.
 * 
 * This page is accessible without admin role to prevent redirect loops.
 */
export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <div className="text-center p-8">
          {/* Icon */}
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-8 h-8 text-red-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold mb-4">Access Restricted</h1>
          
          {/* Message */}
          <p className="text-gray-400 mb-6 leading-relaxed">
            You don&apos;t have permission to access the admin panel. 
            Only users with the <span className="text-purple-400 font-medium">admin</span> role 
            in your organization can access this page.
          </p>

          {/* Help Text */}
          <p className="text-sm text-gray-500 mb-8">
            If you believe you should have access, please contact your organization administrator.
          </p>

          {/* Action Button */}
          <Button
            variant="solid"
            size="lg"
            asChild
            className="w-full"
          >
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
