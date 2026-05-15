import RulesContent from "@/layout/components/rules-content";
import ProtectedRoute from "@/layout/components/protected-route";

function RulesPage() {
  return (
    <ProtectedRoute>
      <RulesContent />
    </ProtectedRoute>
  );
}

export default RulesPage;
