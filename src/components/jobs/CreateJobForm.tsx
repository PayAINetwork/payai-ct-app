import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CreateJobFormData {
  agentHandle: string;
  amount: number;
  currency: 'SOL' | 'PAYAI'; 
  description: string;
}

interface CreateJobFormProps {
  onSubmit: (data: CreateJobFormData) => Promise<void>;
}

export const CreateJobForm: React.FC<CreateJobFormProps> = ({
  onSubmit
}) => {
  const router = useRouter();

  const [formData, setFormData] = useState<CreateJobFormData>({
    agentHandle: '',
    amount: 0,
    currency: 'PAYAI',
    description: ''
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof CreateJobFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.agentHandle.trim() || !formData.description.trim() || formData.amount <= 0) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(formData);
      const sanitizedHandle = formData.agentHandle.replace(/^@/, '');
      const res = await fetch(`/api/agents/${sanitizedHandle}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: formData.amount,
          currency: formData.currency,
          description: formData.description,
        }),
      });
      if (!res.ok) {
        const message = 'Failed to create offer. Please try again.';
        try {
          await res.json();
        } catch {}
        throw new Error(message);
      }
      const data: { job_id: string } = await res.json();
      router.push(`/jobs/${data.job_id}`);
    } catch (error: any) {
      console.error('Error creating agent:', error);
      setError(error?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const isValid = formData.agentHandle.trim() && formData.description.trim() && formData.amount > 0;

  return (
    <Card className="w-full max-w-2xl mx-auto mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Job
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Hide' : 'Show'} Form
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          {error && (
            <div className="mb-4 text-red-600 text-sm font-medium" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Agent Name */}
            <div className="space-y-2">
              <Label htmlFor="agentHandle">Agent Handle *</Label>
              <Input
                id="agentHandle"
                placeholder="Enter agent handle..."
                value={formData.agentHandle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('agentHandle', e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {/* Amount and Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency *</Label>
                <div className="flex gap-2">
                  <Badge
                    variant={formData.currency === 'PAYAI' ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => !loading && handleInputChange('currency', 'PAYAI')}
                  >
                    PAYAI
                  </Badge>
                  <Badge
                    variant={formData.currency === 'SOL' ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => !loading && handleInputChange('currency', 'SOL')}
                  >
                    SOL
                  </Badge>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the job requirements..."
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                rows={4}
                required
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={!isValid || loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Job
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  );
}; 