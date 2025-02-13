import store from "store";
import React from "react";
import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";

import EvaluatedValuePopup from "./EvaluatedValuePopup";
import { ThemeProvider, theme } from "constants/DefaultTheme";
import { EditorTheme } from "./EditorConfig";

describe("EvaluatedValuePopup", () => {
  it("should render evaluated popup when hideEvaluatedValue is false", () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <EvaluatedValuePopup
            theme={EditorTheme.LIGHT}
            isOpen={true}
            hasError={false}
            hideEvaluatedValue={false}
          >
            <div>children</div>
          </EvaluatedValuePopup>
        </ThemeProvider>
      </Provider>,
    );
    const input = screen.queryByTestId("evaluated-value-popup-title");

    expect(input).toBeTruthy();
  });

  it("should not render evaluated popup when hideEvaluatedValue is true", () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <EvaluatedValuePopup
            theme={EditorTheme.LIGHT}
            isOpen={true}
            hasError={false}
            hideEvaluatedValue={true}
          >
            <div>children</div>
          </EvaluatedValuePopup>
        </ThemeProvider>
      </Provider>,
    );
    const input = screen.queryByTestId("evaluated-value-popup-title");

    expect(input).toBeNull();
  });
});
