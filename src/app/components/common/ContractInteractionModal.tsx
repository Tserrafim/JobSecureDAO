import { Dialog, DialogContent, DialogHeader } from './ui/dialog';
import { useTransaction } from '@/hooks/useTransaction';
import { Progress } from './ui/progress';

type ModalProps = {
  title: string;
  description?: string;
  contractMethod: string;
  contractArgs: any[];
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  children: React.ReactNode;
};

export function ContractInteractionModal({
  title,
  description,
  contractMethod,
  contractArgs,
  onSuccess,
  onError,
  children
}: ModalProps) {
  const [open, setOpen] = useState(false);
  const { execute, status, progress } = useTransaction(
    process.env.NEXT_PUBLIC_CORE_ADDRESS,
    coreContractABI,
    contractMethod,
    contractArgs,
    {
      onSuccess: (data) => {
        onSuccess?.(data);
        setOpen(false);
      },
      onError: (error) => {
        onError?.(error);
      }
    }
  );

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        {children}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="neumorphic-modal">
          <DialogHeader>
            <h3 className="font-medium text-lg">{title}</h3>
            {description && (
              <p className="text-neumorph-text-secondary text-sm">
                {description}
              </p>
            )}
          </DialogHeader>

          <div className="my-4">
            {status === 'idle' && (
              <Button onClick={execute} className="w-full">
                Confirm Transaction
              </Button>
            )}

            {status === 'executing' && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-center text-sm">
                  Waiting for confirmation...
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-2 text-center">
                <CheckCircle className="mx-auto w-8 h-8 text-green-500" />
                <p>Transaction successful!</p>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-2 text-center">
                <XCircle className="mx-auto w-8 h-8 text-red-500" />
                <p>Transaction failed</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}