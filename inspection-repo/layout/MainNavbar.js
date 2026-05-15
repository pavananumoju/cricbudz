import {
  Navbar,
  Link,
  Text,
  Avatar,
  Dropdown,
  Spacer,
} from "@nextui-org/react";
// import { AcmeLogo } from "./AcmeLogo.js";
import { useAuth } from "@/context/auth-context.js";
import { useRouter } from "next/router.js";
import { useTheme as useNextTheme } from "next-themes";
import { Switch, useTheme } from "@nextui-org/react";

function MainNavbar() {
  const collapseItems = [
    { key: "0", label: "coming soon", route: "/profile" },
    { key: "1", label: "Profile", route: "/profile" },
    { key: "2", label: "Teams", route: "/teams" },
    { key: "3", label: "Log Out", route: "/logout" },
    { key: "4", label: "Help & Feedback", route: "/fb" },
  ];

  const router = useRouter();

  const { user, logOut } = useAuth();

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.log(error.message);
    }
  };

  const { setTheme } = useNextTheme();
  const { isDark, type } = useTheme();

  return (
    <Navbar isBordered variant="floating" css={{ zIndex: 1000 }}>
      <Navbar.Toggle showIn="xs" />
      <Navbar.Brand
        css={{
          "@xs": {
            w: "12%",
          },
        }}
      >
        <Avatar
          // squared
          size="md"
          src="/icons/CB.png"
          onClick={() => router.push("/dashboard")}
        />
        <Text b color="inherit" hideIn="xs">
          CRICBUDZ
        </Text>
      </Navbar.Brand>
      <Navbar.Content
        enableCursorHighlight
        activeColor="secondary"
        variant="highlight-rounded"
      >
        {user.uid ? (
          <>
            <Navbar.Link
              onClick={() => {
                router.push("/matches/fixtures");
              }}
            >
              Fixtures
            </Navbar.Link>
            <Navbar.Link
              onClick={() => {
                router.push("/matches/todays");
              }}
            >
              Todays
            </Navbar.Link>
          </>
        ) : null}

        {/* <Navbar.Link isActive href="#">
          Customers
        </Navbar.Link> */}
        <Spacer x={0.5} />
        <Switch
          shadow
          checked={isDark}
          onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
        />
        <Spacer x={0.5} />
      </Navbar.Content>
      {/* <div>test</div> */}
      <Navbar.Content
        css={{
          "@xs": {
            w: "12%",
            jc: "flex-end",
          },
        }}
      >
        {user.uid ? (
          <Dropdown placement="bottom-right">
            <Navbar.Item>
              <Dropdown.Trigger>
                <Avatar
                  bordered
                  as="button"
                  color="secondary"
                  size="md"
                  src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
                />
              </Dropdown.Trigger>
            </Navbar.Item>
            <Dropdown.Menu
              aria-label="User menu actions"
              color="secondary"
              onAction={(actionKey) => {
                console.log({ actionKey });
                if (actionKey === "logout") {
                  handleLogout();
                }
                if (actionKey === "teams") {
                  router.push("/teams");
                }
                if (actionKey === "rules") {
                  router.push("/rules");
                }
                if (actionKey === "loaddata") {
                  router.push("/function/loaddata");
                }
              }}
            >
              {!user.uid ? (
                null
              ) : (
                <Dropdown.Item
                  key="profile"
                  css={{
                    height: "$18",
                    "pointer-events": "none",
                    cursor: "default",
                    "text-decoration": "none",
                  }}
                  aria-label="string"
                >
                  <Text b color="inherit" css={{ d: "flex" }}>
                    {user.displayName}
                  </Text>
                </Dropdown.Item>
              )}

              {user.uid ? (
                <Dropdown.Item key="teams" withDivider>
                  Teams
                </Dropdown.Item>
              ) : null}

              {user.uid ? (
                <Dropdown.Item key="rules">Rules</Dropdown.Item>
              ) : null}

              {user.isAdmin && (
                <Dropdown.Item key="loaddata">LoadData</Dropdown.Item>
              )}

              <Dropdown.Item key="help_and_feedback" withDivider>
                Help & Feedback
              </Dropdown.Item>
              {user.uid ? (
                <Dropdown.Item
                  key="logout"
                  withDivider
                  color="error"
                  aria-label="string"
                >
                  <a>Logout</a>
                </Dropdown.Item>
              ) : null}
            </Dropdown.Menu>
          </Dropdown>
        ) : null}
      </Navbar.Content>
      <Navbar.Collapse>
        {collapseItems.map((item, index) => (
          <Navbar.CollapseItem
            key={item.key}
            activeColor="secondary"
            css={{
              color: index === collapseItems.length - 1 ? "$error" : "",
            }}
            isActive={index === 2}
          >
            <Link
              color="inherit"
              css={{
                minWidth: "100%",
              }}
              href="#"
              // href={item.route}
              // onPress={()=>{router.push(`/${item.route}`)}}
            >
              {item.label}
            </Link>
          </Navbar.CollapseItem>
        ))}
      </Navbar.Collapse>
    </Navbar>
  );
}

export default MainNavbar;
