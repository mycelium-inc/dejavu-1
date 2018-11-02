// @flow

import React, { Component } from 'react';
import { Form, Button, Alert, AutoComplete } from 'antd';
import { connect } from 'react-redux';
import { string, func, bool, object } from 'prop-types';
import { withRouter } from 'react-router-dom';

import {
	getAppname,
	getUrl,
	getIsLoading,
	getIsConnected,
} from '../../reducers/app';
import { connectApp, disconnectApp, setMode } from '../../actions';
import {
	getUrlParams,
	getLocalStorageItem,
	setLocalStorageData,
} from '../../utils';

import { getMode } from '../../reducers/mode';
import constants from '../../constants';

type Props = {
	appname?: string,
	url?: string,
	connectApp: (string, string) => void,
	disconnectApp: () => void,
	isConnected: boolean,
	isLoading: boolean,
	error?: object,
	history: object,
	mode: string,
	setMode: string => void,
	onErrorClose: () => void,
};

type State = {
	appname: string,
	url: string,
	pastUrls: string[],
	pastApps: string[],
};

const { Item } = Form;

const formItemProps = {
	wrapperCol: {
		xs: {
			span: 24,
		},
	},
};

class ConnectApp extends Component<Props, State> {
	state = {
		appname: this.props.appname || '',
		url: this.props.url || '',
		pastApps: [],
		pastUrls: [],
	};

	componentDidMount() {
		// sync state from url
		let appname = '';
		let url = '';
		const { mode } = this.props;
		const {
			appname: queryApp,
			url: queryUrl,
			mode: queryMode,
			showDataBrowserOnly,
		} = getUrlParams(window.location.search);

		if (queryApp && queryUrl) {
			appname = queryApp;
			url = queryUrl;
		} else {
			const { appname: propApp, url: propUrl } = this.props;
			appname = propApp || '';
			url = propUrl || '';
		}

		this.setState({
			appname,
			url,
		});

		if (appname && url) {
			this.props.connectApp(appname, url);
		}

		if (!queryApp && !queryUrl) {
			let searchQuery = `?appname=${appname}&url=${url}`;
			const currentMode = queryMode || mode;
			searchQuery += `&mode=${currentMode}`;

			if (showDataBrowserOnly) {
				searchQuery += `&showDataBrowserOnly=${showDataBrowserOnly}`;
			}

			this.props.setMode(currentMode);
			this.props.history.push({ search: searchQuery });
		}

		if (queryMode) {
			this.props.setMode(queryMode);
		}

		this.setPastConnections();
	}

	setPastConnections = () => {
		setTimeout(() => {
			const pastConnections = JSON.parse(
				// $FlowFixMe
				getLocalStorageItem(constants.LOCAL_CONNECTIONS) || {},
			);

			this.setState({
				pastApps: pastConnections.appNames || [],
				pastUrls: pastConnections.urls || [],
			});
		}, 100);
	};

	handleChange = e => {
		const { value, name } = e.target;
		this.setState({
			[name]: value,
		});
	};

	handleUrlChange = url => {
		this.setState({
			url,
		});
	};

	handleAppNameChange = appname => {
		this.setState({
			appname,
		});
	};

	handleSubmit = e => {
		e.preventDefault();
		const { appname, url } = this.state;
		const { showDataBrowserOnly } = getUrlParams(window.location.search);

		let searchQuery = '?';

		if (showDataBrowserOnly) {
			searchQuery += `&showDataBrowserOnly=${showDataBrowserOnly}`;
		}

		if (this.props.isConnected) {
			this.props.disconnectApp();
			this.props.setMode('view');

			this.props.history.push({ search: searchQuery });
		} else if (appname && url) {
			this.props.connectApp(appname, url);
			// update history with correct appname and url
			searchQuery += `&appname=${appname}&url=${url}&mode=${
				this.props.mode
			}`;

			const { pastApps, pastUrls } = this.state;

			const newApps =
				pastApps.indexOf(appname) > -1
					? [...pastApps]
					: [...pastApps, appname];
			const newUrls =
				pastUrls.indexOf(url) > -1 ? [...pastUrls] : [...pastUrls, url];

			this.setState({
				pastApps: newApps,
				pastUrls: newUrls,
			});

			setLocalStorageData(
				constants.LOCAL_CONNECTIONS,
				JSON.stringify({
					appNames: newApps,
					urls: newUrls,
				}),
			);
			this.props.history.push({ search: searchQuery });
		}
	};

	render() {
		const { appname, url, pastApps, pastUrls } = this.state;
		const { isLoading, isConnected } = this.props;
		return (
			<div>
				<Form
					layout="inline"
					onSubmit={this.handleSubmit}
					css={{
						display: 'grid',
						gridTemplateColumns: '1fr 1fr auto',
					}}
				>
					<Item {...formItemProps}>
						<AutoComplete
							dataSource={pastUrls}
							value={url}
							placeholder="URL for cluster goes here. e.g.  https://username:password@scalr.api.appbase.io"
							filterOption={(inputValue, option) =>
								option.props.children
									.toUpperCase()
									.indexOf(inputValue.toUpperCase()) !== -1
							}
							onChange={this.handleUrlChange}
							disabled={isConnected}
						/>
					</Item>
					<Item {...formItemProps}>
						<AutoComplete
							dataSource={pastApps}
							value={appname}
							placeholder="Appname (aka index) goes here"
							filterOption={(inputValue, option) =>
								option.props.children
									.toUpperCase()
									.indexOf(inputValue.toUpperCase()) !== -1
							}
							onChange={this.handleAppNameChange}
							disabled={isConnected}
						/>
					</Item>

					<Item
						css={{
							marginRight: '0px !important',
						}}
					>
						<Button
							type={isConnected ? 'danger' : 'primary'}
							htmlType="submit"
							icon={isConnected ? 'pause-circle' : 'play-circle'}
							disabled={!(appname && url)}
							loading={isLoading}
						>
							{isConnected ? 'Disconnect' : 'Connect'}
						</Button>
					</Item>
				</Form>
				{!isLoading &&
					!isConnected && (
						<Alert
							type="info"
							showIcon
							message="Connecting to ElasticSearch"
							description={
								<div>
									<p>
										To make sure you enable CORS settings
										for your ElasticSearch instance, add the
										following lines in the ES configuration
										file:
									</p>
									<pre>
										{`http.port: 9200
http.cors.allow-origin: http://localhost:1357
http.cors.enabled: true
http.cors.allow-headers : X-Requested-With,X-Auth-Token,Content-Type,Content-Length,Authorization
http.cors.allow-credentials: true`}
									</pre>
								</div>
							}
						/>
					)}
			</div>
		);
	}
}

const mapStateToProps = state => ({
	appname: getAppname(state),
	url: getUrl(state),
	isConnected: getIsConnected(state),
	isLoading: getIsLoading(state),
	mode: getMode(state),
});

const mapDispatchToProps = {
	connectApp,
	disconnectApp,
	setMode,
};

ConnectApp.propTypes = {
	appname: string,
	url: string,
	connectApp: func.isRequired,
	disconnectApp: func.isRequired,
	isConnected: bool.isRequired,
	isLoading: bool.isRequired,
	history: object,
	setMode: func.isRequired,
	mode: string,
};

export default withRouter(
	connect(
		mapStateToProps,
		mapDispatchToProps,
	)(ConnectApp),
);