import { Col, Card, Grid, Text, Row } from "@nextui-org/react";
import { useState } from "react";

function TeamPostCard(props) {
  const { post, user } = props;

  return (
    <ul>
      <Grid.Container gap={1} key={`${post.email} + ${post.p1.id}`} sm="12">
        <Card
          isPressable
          isHoverable
          variant="bordered"
          css={{
            mw: "600px",
            borderColor: "violet",
            // backgroundColor:"black"
          }}
        >
          <Card.Body>
            <Row align="center">
              <Grid.Container justify="center">
                <Grid xs={4}>
                  <Col>
                    <Text color={user.email === post.email ? "warning" : ""}>
                      {user.email === post.email ? "Your team" : post.name}
                    </Text>
                    <Text>{post.updatedTime}</Text>
                  </Col>
                </Grid>
                <Grid xs={7}>
                  <Col>
                    <Text color={post.p1.mvp && "success"}>{post.p1.name}</Text>
                    <Text color={post.p2.mvp && "success"}>{post.p2.name}</Text>
                    <Text color={post.p3.mvp && "success"}>{post.p3.name}</Text>
                  </Col>
                </Grid>
                <Grid xs={1}>
                  <Col>
                    <Text color={post.p1.mvp && "success"}>
                      {post.p1.points ? post.p1.points : "-"}
                    </Text>
                    <Text color={post.p2.mvp && "success"}>
                      {post.p2.points ? post.p2.points : "-"}
                    </Text>
                    <Text color={post.p3.mvp && "success"}>
                      {post.p3.points ? post.p3.points : "-"}
                    </Text>
                  </Col>
                </Grid>
              </Grid.Container>
            </Row>
            <Row>
              <Grid.Container justify="center">
                <Grid xs={4}>
                  <Col></Col>
                </Grid>
                <Grid
                  xs={7}
                  css={{
                    color: "yellow",
                    fontWeight: "bold",
                    background: "$blue200",
                  }}
                >
                  <Col>Total:</Col>
                </Grid>
                <Grid
                  xs={1}
                  css={{
                    color: "yellow",
                    fontWeight: "bold",
                    background: "$blue200",
                  }}
                >
                  <Col>
                    {(post.p1.points != undefined ? post.p1.points : 0) +
                      (post.p2.points != undefined ? post.p2.points : 0) +
                      (post.p3.points != undefined ? post.p3.points : 0)}
                  </Col>
                </Grid>
              </Grid.Container>
            </Row>
          </Card.Body>
        </Card>
      </Grid.Container>
    </ul>
  );
}

export default TeamPostCard;
