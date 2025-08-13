import { Label } from "@radix-ui/react-label";
import { isNil, isEmpty, either } from "ramda";
import { useTranslation } from "react-i18next";

import {
  Card as CardContainer,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const isNilOrEmpty = either(isNil, isEmpty);

interface ICardProps {
  className?: string;
  title: string;
  imgSrc?: string;
  desc: string;
  status: string;
  stock: string;
  price: string;
  footer?: React.ReactNode;
}

const Card = (props: ICardProps) => {
  const { className, title, desc, footer, imgSrc, status, stock, price } =
    props;
  const { t } = useTranslation();
  const imageUrl = !isNilOrEmpty(imgSrc)
    ? imgSrc
    : "https://placehold.co/350x350";

  return (
    <CardContainer className={cn("flex size-full flex-col", className)}>
      <CardHeader className="flex-[0_0_auto] p-0">
        <div className="h-[320px] w-full">
          <img
            className="size-full rounded-t-lg object-cover"
            src={imageUrl}
            alt={title}
            loading="lazy"
          />
        </div>
      </CardHeader>

      <CardContent className="flex size-full flex-col gap-y-1.5 p-4">
        <CardTitle className="line-clamp-1">{title}</CardTitle>
        <CardDescription className="line-clamp-2">{desc}</CardDescription>
        <div className="flex flex-col justify-around">
          <div className="flex items-center gap-x-2">
            <Label>{t("table.headers.product.productStatus")}:</Label>
            <p className="text-sm text-gray-500">{status}</p>
          </div>
          <div className="flex items-center gap-x-2">
            <Label>{t("table.headers.product.productStock")}:</Label>
            <p className="text-sm text-gray-500">{stock}</p>
          </div>
          <div className="flex items-center gap-x-2">
            <Label>{t("table.headers.product.price")}:</Label>
            <p className="text-sm text-gray-500">{price}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-end p-4">
        {footer}
      </CardFooter>
    </CardContainer>
  );
};

export default Card;
