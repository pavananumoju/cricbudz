import TeamDetails from "./team-detail";
import { Container, Spacer, Text } from "@nextui-org/react";

function TeamList(props) {
  return (
    <Container justify="center" align="center">
      <div>
        <Spacer y={1}/>
        <Text size="$xl">All Teams</Text>
        <ul>
          {props.teams.map((team) => (
            <TeamDetails key={team.squadId} team={team} />
          ))}
        </ul>
      </div>
    </Container>
  );
}

export default TeamList;
