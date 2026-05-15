import { Col, Text, Button, Row } from "@nextui-org/react";
import { useRouter } from "next/router";
import { getDate_dd_month_yyyy } from "./utils/date-utils";

function MatchListCardRow(props) {
  const { matchesData, today, match, match_data } = props;

  const router = useRouter();
  const dateObj = new Date(matchesData.date);
  const date_dd_month_yyyy = getDate_dd_month_yyyy(dateObj);

//   function handleMatchClick(match, team1_id, team2_id) {
//     router.push(
//       `/function/team-selection-page/?date=${date_dd_month_yyyy}&match=${match}&team1=${team1_id}&team2=${team2_id}`
//     );
//   }


  return (
    <Row align="center">
      <Col>
        <Text>{match === "m1" ? "Match - 1" : "Match - 2"}</Text>
      </Col>
      <Col>
        <Button
          disabled={matchesData.date != today}
          size="sm"
          // auto
        //   onPress={() =>
        //     handleMatchClick(
        //       match,
        //       match_data.matchInfo.team1.teamId,
        //       match_data.matchInfo.team2.teamId
        //     )
        //   }
        >
          {match_data.matchInfo.team1.teamSName} vs{" "}
          {match_data.matchInfo.team2.teamSName}
        </Button>
      </Col>
    </Row>
  );
}

export default MatchListCardRow;
