import { Link } from "@tanstack/react-router";

import {
  Breadcrumb as BreadcrumbRoot,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import type { BreadcrumbItem as BreadcrumbItemType } from "@/hooks/use-breadcrumb";

interface BreadcrumbProps {
  items: BreadcrumbItemType[];
}

const Breadcrumb = ({ items }: BreadcrumbProps) => {
  if (items.length === 0) return null;

  return (
    <BreadcrumbRoot className="shrink-0 grow">
      <BreadcrumbList>
        {items.map((item, index) => (
          <BreadcrumbItem key={item.path}>
            {item.isActive ? (
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link to={item.path}>{item.label}</Link>
              </BreadcrumbLink>
            )}
            {index < items.length - 1 && <BreadcrumbSeparator />}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </BreadcrumbRoot>
  );
};

export default Breadcrumb;
