import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Navbar } from "@/components/shared/Navbar";
import Paper from "@/components/shared/Paper";
import { TextInput } from "@/components/shared/TextInputs";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { userSchema } from "@/services/contracts/user";

import type { TUser } from "@/services/contracts/user";

type TUserForm = Omit<TUser, "created_at" | "updated_at" | "role">;

const DEFAULT_VALUES: TUserForm = {
  user_id: "",
  email: "",
  first_name: "",
  last_name: "",
  phone_number: "",
  address: "",
  remark: "",
};

const UserFormPage = () => {
  const { t } = useTranslation();
  // const { id } = useParams({ from: "/users/edit/$id" })

  const form = useForm<TUserForm>({
    resolver: zodResolver(
      userSchema.omit({ created_at: true, updated_at: true, role: true })
    ),
    defaultValues: DEFAULT_VALUES,
    mode: "onChange",
  });

  const isLoading = false;
  const userData = null;

  useEffect(() => {
    if (userData) {
      form.reset(userData);
    }
  }, [form, userData]);

  const onSubmit = form.handleSubmit(() => {
    // Handle form submission
  });

  if (isLoading) {
    return (
      <div className="flex size-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const navbarActions = (
    <div className="flex w-full items-center justify-end">
      <Button
        type="submit"
        form="user-form"
        className="h-10 w-fit"
        disabled={!form.formState.isDirty}
      >
        {t("common.submit")}
      </Button>
    </div>
  );

  return (
    <main className="flex size-full flex-col">
      <Navbar>{navbarActions}</Navbar>
      <form
        id="user-form"
        className="flex size-full flex-col gap-4 p-4"
        onSubmit={onSubmit}
      >
        <Paper className="flex w-full flex-col gap-4">
          <h3 className="text-2xl font-bold">
            {t("pages.users.userForm.title")}
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextInput
              label={t("pages.users.userForm.firstName")}
              error={form.formState.errors.first_name}
              {...form.register("first_name")}
            />

            <TextInput
              label={t("pages.users.userForm.lastName")}
              error={form.formState.errors.last_name}
              {...form.register("last_name")}
            />

            <TextInput
              label={t("pages.users.userForm.email")}
              error={form.formState.errors.email}
              type="email"
              {...form.register("email")}
            />

            <TextInput
              label={t("pages.users.userForm.phoneNumber")}
              error={form.formState.errors.phone_number}
              {...form.register("phone_number")}
            />

            <TextInput
              label={t("pages.users.userForm.address")}
              error={form.formState.errors.address}
              {...form.register("address")}
            />

            <TextInput
              label={t("pages.users.userForm.remark")}
              error={form.formState.errors.remark}
              {...form.register("remark")}
            />
          </div>
        </Paper>
      </form>
    </main>
  );
};

export default UserFormPage;
