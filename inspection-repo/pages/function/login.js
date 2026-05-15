import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/router";
import { FormProvider, useForm } from "react-hook-form";
import { Container, Text, Input, Button, Spacer, Loading } from "@nextui-org/react";
import { useState } from "react";

function Login() {
  const methods = useForm();
  const { user, logIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  if (user.uid) {
    // console.log(user);
    user.isTnCAccepted ? router.push("/dashboard") : router.push("/rules")
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      console.log(data);
      await logIn(data.email, data.password);
      // router.push("/dashboard");
      // console.log('setting loading false');
      setIsLoading(false);
    } catch (error) {
      console.log(error.message);
      setIsLoading(false);
      setMessage(error.message);
    }
  };

  return (
    <Container justify="center" align="center">
      <Spacer y={1} />
      <Text>Log In</Text>
      <Spacer y={1} />
      <FormProvider {...methods}>
        <form action="" onSubmit={handleSubmit(onSubmit)}>
          <Input
            type="email"
            label="Email"
            bordered
            width="250px"
            color="secondary"
            labelPlaceholder="Email"
            {...register("email", { required: "Email is required" })}
          />
          {errors.email && (
            <Text color="warning">{errors.email.message}</Text>
          )}
          <Spacer y={1.5} />
          <Input.Password
            bordered
            color="secondary"
            label="Password"
            width="250px"
            type="password"
            {...register("password", { required: "Password is required" })}
            labelPlaceholder="Password"
          />
          {errors.password && (
            <Text color="warning">{errors.password.message}</Text>
          )}
          <Spacer y={1} />
          <Button color={"primary"} ghost type="submit">
            Submit
          </Button>
          <Spacer y={2} />
          {isLoading && <Loading size="lg" color="warning" />}
          {!isLoading && message && <Text color="orange">{message}</Text>}
          <Spacer y={2} />
          <Button
            ghost
            size="sm"
            auto
            // color={"primary"}
            onPress={() => {
              router.push("/function/signup");
            }}
          >
            Signup
          </Button>
        </form>
      </FormProvider>
    </Container>
  );
}

export default Login;
