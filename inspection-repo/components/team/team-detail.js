import { Card, User, Grid, Spacer, Image } from "@nextui-org/react";
import { useRouter } from "next/router";

function TeamDetails(props) {
  const teamData = props.team;
  const router = useRouter();

  return (
    <li>
      <Card
        isPressable
        isHoverable
        variant="bordered"
        css={{ mw: "600px" }}
        onClick={() => {
          router.push(`/teams/${teamData.squadId}`);
        }}
      >
        <Card.Body>
          <User
            squared
            src={`/images/teams/${teamData.squadId}.jpg`}
            name={teamData.squadType}
            css={{ p: 0 }}
          >
            {teamData.squadId}
          </User>
        </Card.Body>
      </Card>
    </li>
  );
}

export default TeamDetails;
