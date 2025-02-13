import React, { Component, useCallback } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import {
  getIsPropertyPaneVisible,
  getWidgetPropsForPropertyPane,
} from "selectors/propertyPaneSelectors";
import {
  PanelStack,
  IPanel,
  Classes,
  IPanelProps,
  Icon,
} from "@blueprintjs/core";

import Popper from "pages/Editor/Popper";
import { generateClassName } from "utils/generators";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import styled from "constants/DefaultTheme";
import { WidgetProps } from "widgets/BaseWidget";
import PropertyPaneTitle from "pages/Editor/PropertyPaneTitle";
import AnalyticsUtil from "utils/AnalyticsUtil";
import * as log from "loglevel";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import PropertyControlsGenerator from "./Generator";
import PaneWrapper from "components/editorComponents/PaneWrapper";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { ThemeMode, getCurrentThemeMode } from "selectors/themeSelectors";
import {
  deleteSelectedWidget,
  copyWidget,
  selectWidget,
} from "actions/widgetActions";
import { ControlIcons } from "icons/ControlIcons";
import { FormIcons } from "icons/FormIcons";
import PropertyPaneHelpButton from "pages/Editor/PropertyPaneHelpButton";
import { getProppanePreference } from "selectors/usersSelectors";
import { PropertyPanePositionConfig } from "reducers/uiReducers/usersReducer";
import { get } from "lodash";

const PropertyPaneWrapper = styled(PaneWrapper)<{
  themeMode?: EditorTheme;
}>`
  width: 100%;
  max-height: ${(props) => props.theme.propertyPane.height}px;
  width: ${(props) => props.theme.propertyPane.width}px;
  margin-bottom: ${(props) => props.theme.spaces[2]}px;
  margin-left: ${(props) => props.theme.spaces[10]}px;
  padding: ${(props) => props.theme.spaces[5]}px;
  padding-top: 0px;
  padding-right: ${(props) => props.theme.spaces[5]}px;
  border-right: 0;
  overflow-y: auto;
  overflow-x: hidden;
  text-transform: none;
`;

const StyledPanelStack = styled(PanelStack)`
  height: auto;
  width: 100%;
  margin: 0;
  &&& .bp3-panel-stack-view {
    margin: 0;
    border: none;
    background: transparent;
  }
  overflow: visible;
  position: static;
  &&& .${Classes.PANEL_STACK_VIEW} {
    position: static;
    overflow: hidden;
  }
`;

const CopyIcon = ControlIcons.COPY_CONTROL;
const DeleteIcon = FormIcons.DELETE_ICON;
interface PropertyPaneState {
  currentPanelStack: IPanel[];
}

export const PropertyControlsWrapper = styled.div`
  margin-top: ${(props) => props.theme.propertyPane.titleHeight}px;
`;

const PropertyPaneView = (
  props: {
    hidePropertyPane: () => void;
    theme: EditorTheme;
  } & IPanelProps,
) => {
  const { hidePropertyPane, theme, ...panel } = props;
  const widgetProperties: any = useSelector(getWidgetPropsForPropertyPane);

  const dispatch = useDispatch();
  const handleDelete = useCallback(() => {
    dispatch(deleteSelectedWidget(false));
  }, [dispatch]);
  const handleCopy = useCallback(() => dispatch(copyWidget(false)), [dispatch]);

  return (
    <>
      <PropertyPaneTitle
        key={widgetProperties.widgetId}
        title={widgetProperties.widgetName}
        widgetId={widgetProperties.widgetId}
        widgetType={widgetProperties?.type}
        actions={[
          {
            tooltipContent: "Copy Widget",
            icon: (
              <CopyIcon
                className="t--copy-widget"
                width={14}
                height={14}
                onClick={handleCopy}
              />
            ),
          },
          {
            tooltipContent: "Delete Widget",
            icon: (
              <DeleteIcon
                className="t--delete-widget"
                width={16}
                height={16}
                onClick={handleDelete}
              />
            ),
          },
          {
            tooltipContent: <span>Explore widget related docs</span>,
            icon: <PropertyPaneHelpButton />,
          },
          {
            tooltipContent: "Close",
            icon: (
              <Icon
                onClick={(e: any) => {
                  AnalyticsUtil.logEvent("PROPERTY_PANE_CLOSE_CLICK", {
                    widgetType: widgetProperties.widgetType,
                    widgetId: widgetProperties.widgetId,
                  });
                  hidePropertyPane();
                  e.preventDefault();
                  e.stopPropagation();
                }}
                iconSize={16}
                icon="cross"
                className={"t--property-pane-close-btn"}
              />
            ),
          },
        ]}
      />
      <PropertyControlsWrapper>
        <PropertyControlsGenerator
          id={widgetProperties.widgetId}
          type={widgetProperties.type}
          panel={panel}
          theme={theme}
        />
      </PropertyControlsWrapper>
    </>
  );
};

class PropertyPane extends Component<PropertyPaneProps, PropertyPaneState> {
  private panelWrapperRef = React.createRef<HTMLDivElement>();

  getTheme() {
    return EditorTheme.LIGHT;
  }

  getPopperTheme() {
    return ThemeMode.LIGHT;
  }

  render() {
    if (get(this.props, "widgetProperties.disablePropertyPane")) {
      return null;
    }

    if (this.props.isVisible) {
      log.debug("Property pane rendered");
      const content = this.renderPropertyPane();
      const el = document.getElementsByClassName(
        generateClassName(this.props.widgetProperties?.widgetId),
      )[0];

      return (
        <Popper
          themeMode={this.getPopperTheme()}
          position={this.props?.propPanePreference?.position}
          disablePopperEvents={this.props?.propPanePreference?.isMoved}
          onPositionChange={(position: any) =>
            this.props.setPropPanePoistion(
              position,
              this.props.widgetProperties?.widgetId,
            )
          }
          isDraggable={true}
          isOpen={true}
          targetNode={el}
          zIndex={3}
          placement="right-start"
        >
          {content}
        </Popper>
      );
    } else {
      return null;
    }
  }

  renderPropertyPane() {
    const { widgetProperties } = this.props;

    if (!widgetProperties) {
      return <></>;
    }

    // if settings control is disabled, don't render anything
    // for e.g - this will be true for list widget tempalte container widget
    if (widgetProperties?.disablePropertyPane) return <></>;

    return (
      <PropertyPaneWrapper
        className={"t--propertypane"}
        themeMode={this.getTheme()}
        ref={this.panelWrapperRef}
        onClick={(e: any) => {
          e.stopPropagation();
        }}
      >
        <StyledPanelStack
          onOpen={() => {
            const parent = this.panelWrapperRef.current;
            parent?.scrollTo(0, 0);
          }}
          initialPanel={{
            component: PropertyPaneView,
            props: {
              hidePropertyPane: this.props.hidePropertyPane,
              theme: this.getTheme(),
            },
          }}
          showPanelHeader={false}
        />
      </PropertyPaneWrapper>
    );
  }

  componentDidMount() {
    PerformanceTracker.stopTracking(
      PerformanceTransactionName.OPEN_PROPERTY_PANE,
    );
  }

  componentDidUpdate(prevProps: PropertyPaneProps) {
    if (
      this.props.widgetProperties?.widgetId !==
        prevProps.widgetProperties?.widgetId &&
      this.props.widgetProperties?.widgetId !== undefined
    ) {
      PerformanceTracker.stopTracking(
        PerformanceTransactionName.OPEN_PROPERTY_PANE,
      );
      if (prevProps.widgetProperties?.widgetId && prevProps.widgetProperties) {
        AnalyticsUtil.logEvent("PROPERTY_PANE_CLOSE", {
          widgetType: prevProps.widgetProperties.type,
          widgetId: prevProps.widgetProperties.widgetId,
        });
      }
      if (this.props.widgetProperties) {
        AnalyticsUtil.logEvent("PROPERTY_PANE_OPEN", {
          widgetType: this.props.widgetProperties.type,
          widgetId: this.props.widgetProperties.widgetId,
        });
      }
    }

    if (
      this.props.widgetProperties?.widgetId ===
        prevProps.widgetProperties?.widgetId &&
      this.props.isVisible &&
      !prevProps.isVisible &&
      this.props.widgetProperties !== undefined
    ) {
      AnalyticsUtil.logEvent("PROPERTY_PANE_OPEN", {
        widgetType: this.props.widgetProperties.type,
        widgetId: this.props.widgetProperties.widgetId,
      });
    }

    return true;
  }
}

const mapStateToProps = (state: AppState) => {
  return {
    widgetProperties: getWidgetPropsForPropertyPane(state),
    isVisible: getIsPropertyPaneVisible(state),
    themeMode: getCurrentThemeMode(state),
    propPanePreference: getProppanePreference(state),
  };
};

const mapDispatchToProps = (dispatch: any): PropertyPaneFunctions => {
  return {
    setPropPanePoistion: (position: any, widgetId: any) => {
      dispatch({
        type: ReduxActionTypes.PROP_PANE_MOVED,
        payload: {
          position: {
            left: position.left,
            top: position.top,
          },
        },
      });
      dispatch(selectWidget(widgetId));
    },
    hidePropertyPane: () =>
      dispatch({
        type: ReduxActionTypes.HIDE_PROPERTY_PANE,
      }),
  };
};

export interface PropertyPaneProps extends PropertyPaneFunctions {
  widgetProperties?: WidgetProps;
  isVisible: boolean;
  themeMode: ThemeMode;
  propPanePreference?: PropertyPanePositionConfig;
}

export interface PropertyPaneFunctions {
  hidePropertyPane: () => void;
  setPropPanePoistion: (position: any, widgetId: any) => void;
}

export default connect(mapStateToProps, mapDispatchToProps)(PropertyPane);
