import { Container, Spacer, Text, Button } from "@nextui-org/react";
import { useRouter } from "next/router";

export default function App() {
  const router = useRouter();
  return (
    <Container justify="center" align="center">
      <Spacer y={1} />
      <Text>WELCOME TO CRICBUDZ</Text>
      <Spacer y={1} />
      <Text>Click below to login</Text>
      <Spacer y={1} />
      <Button
        ghost
        size="sm"
        auto
        // color={"primary"}
        onClick={() => {
          router.push("/function/login");
        }}
      >
        Login
      </Button>
    </Container>
  );
}
