import { cn } from "@/lib/utils";

interface IPaperProps extends React.PropsWithChildren {
  className?: string;
}
const Paper = (props: IPaperProps) => {
  return (
    <div className={cn("size-fit rounded-2xl p-6", props.className)}>
      {props.children}
    </div>
  );
};

export default Paper;
