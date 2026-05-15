import ProtectedRoute from "@/layout/components/protected-route";
import { useAuth } from "@/context/auth-context";
import { Container, Spacer, Text, Button } from "@nextui-org/react";
import ResultDisplay from "@/components/results/result-display";

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <Container justify="center" align="center">
        <Spacer y={2} />
        <Text
          size={20}
          css={{
            textGradient: "45deg, $blue600 -20%, $pink600 50%",
          }}
        >
          Welcome to Cricbudz
        </Text>
        <Text
          h1
          size={30}
          css={{
            textGradient: "45deg, $yellow600 -20%, $red600 100%",
          }}
          weight="bold"
        >
          "{user.displayName}"
        </Text>
        <ResultDisplay user={user}/>
      </Container>
    </ProtectedRoute>
  );
};

export default DashboardPage;
