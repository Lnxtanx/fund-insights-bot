import { FinanceChatbot } from '@/components/FinanceChatbot';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
      <div className="max-w-3xl mx-auto h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)]">
        <FinanceChatbot />
      </div>
    </div>
  );
};

export default Index;
