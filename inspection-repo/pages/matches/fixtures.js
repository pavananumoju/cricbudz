import { Container, Spacer, Text, Row, Col } from "@nextui-org/react";
import { getDocFromDB } from "@/components/utils/firebase-db-utils";
import MatchListCard from "@/components/match-list-card";

function Fixtures(props) {
  const { fixtures } = props;
  return (
    <Container justify="center" align="center">
      <Spacer y={2} />
      <Text>Fixtures 2023</Text>
      <Spacer y={0.5} />
      <Row gap={0.5}>
        <Col>
          <Text size={12}>Date</Text>
        </Col>
        <Col>
          <Text size={12}>Match 1</Text>
        </Col>
        <Col>
          <Text size={12}>Match 2</Text>
        </Col>
      </Row>
      <ul>
        {fixtures.map((data,index) => (
          <MatchListCard key={index} matchData={data}/>

        ))}
      </ul>
    </Container>
  );
}

export async function getStaticProps() {
  const docSnap = await getDocFromDB("Fixtures", "2023");
  return { props: { fixtures: docSnap.data().matchDetails } };
}

export default Fixtures;
