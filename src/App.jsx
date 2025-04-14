import React, { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { loginRequest } from "./authConfig";

const updateUsers = (setUsers, instance, accounts) => {
  if (accounts.length > 0) {
    instance
      .acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      })
      .then((response) => {
        fetch(
          "https://graph.microsoft.com/v1.0/users?$select=id,displayName,extension_24a8955a629c4869b36185a566f48b4a_Admin",
          {
            headers: {
              Authorization: `Bearer ${response.accessToken}`,
            },
          }
        )
          .then(async (res) => await res.json())
          .then((response) => {
            console.log(response.value);
            setUsers(response.value);
          })
          .catch((error) => {
            console.error(error);
          });
      });
  }
};
function MyComponent() {
  const { instance, accounts } = useMsal();
  const [loginMenu, setLoginMenu] = useState();
  const [authenticatedUser, setUser] = useState();
  const [users, setUsers] = useState([]);
  const [editAdmins, openAdministrators] = useState(false);
  const [selection, setSelection] = useState("");
  const [selector, setSelector] = useState("");
  const [generalLedger, setGeneralLedger] = useState(null);
  const [payoutLog, setPayoutLog] = useState(null);

  useEffect(() => {
    if (accounts.length > 0) {
      instance
        .acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        })
        .then((response) => {
          fetch(
            `https://graph.microsoft.com/v1.0/users/${accounts[0].localAccountId}?$select=id,displayName,extension_24a8955a629c4869b36185a566f48b4a_Admin`,
            {
              headers: {
                Authorization: `Bearer ${response.accessToken}`,
              },
            }
          )
            .then(async (res) => await res.json())
            .then((response) => {
              console.log("authenticatedUser", response);
              setUser(response);
            })
            .catch((error) => {
              console.error(error);
            });
        });
    }
  }, [instance, accounts]);

  return loginMenu ? (
    <div>
      <div
        onClick={() => setLoginMenu(false)}
        style={{
          cursor: "pointer",
          margin: "5px",
          textAlign: "center",
          borderRadius: "10px",
          width: "20px",
          height: "min-content",
          padding: "5px",
          border: "1px solid black",
        }}
      >
        x
      </div>
      {accounts.length > 0 ? (
        <div>
          <p>
            Signed in as: {accounts[0].username}, {accounts[0].localAccountId}
          </p>
          <button onClick={() => instance.logout()}>Log out</button>
          {!editAdmins ? (
            <button
              onClick={() => {
                openAdministrators(true);
                updateUsers(setUsers, instance, accounts);
              }}
            >
              +/- Update admins
            </button>
          ) : (
            <div>
              <button
                onClick={() => {
                  openAdministrators(false);
                }}
              >
                - Close
              </button>
              <ul>
                {users.map((user) => (
                  <li
                    onClick={() => {
                      /*if (
                        !authenticatedUser.extension_24a8955a629c4869b36185a566f48b4a_Admin
                      )
                        return null;*/
                      const answer =
                        //!user.extension_24a8955a629c4869b36185a566f48b4a_Admin &&
                        window.confirm(
                          user.extension_24a8955a629c4869b36185a566f48b4a_Admin
                            ? "Remove " +
                                user.displayName +
                                " as admin?" +
                                (authenticatedUser.extension_24a8955a629c4869b36185a566f48b4a_Admin
                                  ? " You will not have administrative privileges anymore."
                                  : "")
                            : "Would you like to make " +
                                user.displayName +
                                " admin? This allows them to view financial statements and approve payroll."
                        );
                      if (answer) {
                        //|| user.extension_24a8955a629c4869b36185a566f48b4a_Admin) {
                        //https://www.reddit.com/r/sysadmin/comments/1gz9evy/entra_id_custom_attribute_on_user_record/
                        instance
                          .acquireTokenSilent({
                            ...loginRequest,
                            account: accounts[0],
                          })
                          .then((response) => {
                            fetch(
                              "https://graph.microsoft.com/v1.0/users/" +
                                user.id,
                              {
                                headers: {
                                  Authorization: `Bearer ${response.accessToken}`,
                                  "Content-Type": "application/JSON",
                                },
                                method: "PATCH",
                                body: JSON.stringify({
                                  extension_24a8955a629c4869b36185a566f48b4a_Admin:
                                    user.extension_24a8955a629c4869b36185a566f48b4a_Admin
                                      ? false
                                      : true,
                                }), //8705757a8c794156ac5f7a1bf13af481
                                //0ccab800ce534413a0e8e3619f5fd1d1
                              }
                            )
                              //.then(async (res) => await res.json())
                              .then((response) => {
                                console.log(response);

                                updateUsers(setUsers, instance, accounts);
                              })
                              .catch((error) => {
                                console.error(error);
                              });
                          });
                      }
                    }}
                    key={user.id}
                  >
                    {user.displayName}{" "}
                    {user.extension_24a8955a629c4869b36185a566f48b4a_Admin &&
                      "(admin)"}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div>
          <button onClick={() => instance.loginPopup()}>Log in</button>
          NuCulture RAIFinancial
        </div>
      )}
    </div>
  ) : (
    <div>
      <div
        style={{
          fontWeight: "bolder",
          color: "white",
          backgroundColor: "orange",
          width: "100vw",
          height: selection !== "" ? "min-content" : "100vh",
          transition: ".3s ease-out",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              cursor: "pointer",
              padding: "5px",
            }}
            onClick={() => {
              setLoginMenu(true);
            }}
          >
            <div
              style={{
                borderRadius: "5px",
                margin: "5px",
                width: "30px",
                height: "5px",
                backgroundColor: "white",
              }}
            ></div>
            <div
              style={{
                borderRadius: "5px",
                margin: "5px",
                width: "30px",
                height: "5px",
                backgroundColor: "white",
              }}
            ></div>
            <div
              style={{
                borderRadius: "5px",
                margin: "5px",
                width: "30px",
                height: "5px",
                backgroundColor: "white",
              }}
            ></div>
          </div>
          NuCulture RAIFinancial
        </div>
        {!authenticatedUser ? (
          <div style={{ padding: "0px 10px" }}>
            Must be logged in to view this page.
          </div>
        ) : !authenticatedUser.extension_24a8955a629c4869b36185a566f48b4a_Admin ? (
          <div style={{ padding: "0px 10px" }}>
            Must be an admin to view this page.
          </div>
        ) : (
          <div>
            {selection === "" && (
              <ul
                style={{
                  cursor: "pointer",
                  color: "darkcyan",
                }}
              >
                <li
                  onMouseEnter={(e) => setSelector("I/S")}
                  style={{
                    listStyleType: selector === "I/S" ? "initial" : "none",
                  }}
                  onClick={() => setSelection("I/S")}
                >
                  I/S
                </li>
                <li
                  onMouseEnter={(e) => setSelector("General Ledger")}
                  style={{
                    listStyleType:
                      selector === "General Ledger" ? "initial" : "none",
                  }}
                  onClick={() => {
                    setSelection("General Ledger");
                    setGeneralLedger([{ Amount: "loading..." }]);
                    instance
                      .acquireTokenSilent({
                        ...loginRequest,
                        account: accounts[0],
                      })
                      .then((response) => {
                        fetch(
                          "https://raifinancial.azurewebsites.net/api/generalledger",
                          {
                            method: "GET",
                            headers: {
                              Authorization: "Bearer " + response.idToken,
                              "Content-Type": "application/JSON",
                            },
                          }
                        )
                          .then(async (res) => await res.json())
                          .then((result) => {
                            console.log(result);
                            setGeneralLedger(result.generalLedger);
                          });
                      });
                  }}
                >
                  General Ledger
                </li>
                <li
                  onMouseEnter={(e) => setSelector("Charts")}
                  style={{
                    listStyleType: selector === "Charts" ? "initial" : "none",
                  }}
                  onClick={() => setSelection("Charts")}
                >
                  Charts
                </li>
                <li
                  onMouseEnter={(e) => setSelector("Bank")}
                  style={{
                    listStyleType: selector === "Bank" ? "initial" : "none",
                  }}
                  onClick={() => setSelection("Bank")}
                >
                  Bank
                </li>
                <li
                  onMouseEnter={(e) => setSelector("Payroll")}
                  style={{
                    listStyleType: selector === "Payroll" ? "initial" : "none",
                  }}
                  onClick={() => {
                    setSelection("Payroll");
                    setPayoutLog([{ EmployeeName: "loading..." }]);
                    instance
                      .acquireTokenSilent({
                        ...loginRequest,
                        account: accounts[0],
                      })
                      .then((response) => {
                        fetch(
                          "https://raifinancial.azurewebsites.net/api/payoutLog",
                          {
                            method: "GET",
                            headers: {
                              Authorization: "Bearer " + response.idToken,
                              "Content-Type": "application/JSON",
                            },
                          }
                        )
                          .then(async (res) => await res.json())
                          .then((result) => {
                            console.log(result);
                            setPayoutLog(result.payoutLog);
                          });
                      });
                  }}
                >
                  Payroll
                </li>
                <li
                  onMouseEnter={(e) => setSelector("Invoices")}
                  style={{
                    listStyleType: selector === "Invoices" ? "initial" : "none",
                  }}
                  onClick={() => setSelection("Invoices")}
                >
                  Invoices
                </li>
              </ul>
            )}
          </div>
        )}
      </div>
      <div
        style={{
          margin: "10px",
          display: "flex",
        }}
        onClick={() => setSelection("")}
      >
        <div
          style={{
            cursor: "pointer",
            borderRadius: "8px",
            border: "1px solid black",
            width: "min-content",
            textAlign: "center",
            padding: "0px 5px",
          }}
        >
          &times;
        </div>
        &nbsp;
        {selection}
      </div>
      <div
        style={{
          backgroundColor: "peachpuff",
        }}
      >
        {selection === "General Ledger" && (
          <table>
            {generalLedger !== null && generalLedger.length > 0 && (
              <thead>
                <tr>
                  <td>Amount</td>
                </tr>
              </thead>
            )}
            <tbody>
              {generalLedger === null
                ? ""
                : generalLedger.length === 0
                ? "No results"
                : generalLedger.map((x) => {
                    return (
                      <tr>
                        <td>{x.Amount}</td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        )}
        {selection === "Payroll" && (
          <table>
            {payoutLog !== null && payoutLog.length > 0 && (
              <thead>
                <tr>
                  <td>Date</td>
                  <td>Employee</td>
                  <td>Amount</td>
                </tr>
              </thead>
            )}
            <tbody>
              {payoutLog === null
                ? ""
                : payoutLog.length === 0
                ? "No results"
                : payoutLog.map((x) => {
                    return (
                      <tr key={x.CreatedAt}>
                        <td>{new Date(x.PaymentDate).toLocaleDateString()}</td>
                        <td>{x.EmployeeName}</td>
                        <td>${x.AmountPaid}</td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        )}
      </div>
      End of results.
    </div>
  );
}

export default MyComponent;
