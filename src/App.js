import React, { Component } from 'react';
import { Layout } from 'antd';
import { BrowserRouter, Route } from 'react-router-dom';
import { Provider } from 'react-redux';

import Dejavu from './components/Dejavu';
import Importer from './components/Importer';
import SearchPreview from './components/SearchPreview';
import Mappings from './components/Mappings';
import Navigation from './components/Navigation';

import configureStore from './store';
import {
	getUrlParams,
	getLocalStorageItem,
	setLocalStorageData,
} from './utils';
import constants from './constants';

import logo from './images/dejavu-logo.svg';

const { Content, Sider } = Layout;
const store = configureStore();

class App extends Component {
	state = {
		isShowingSideBar: true,
	};

	componentDidMount() {
		const { showDataBrowserOnly } = getUrlParams(window.location.search);

		if (showDataBrowserOnly && showDataBrowserOnly === 'true') {
			this.setSideBarVisibility(false);
		}

		const localConnections = getLocalStorageItem(
			constants.LOCAL_CONNECTIONS,
		);

		if (!localConnections) {
			setLocalStorageData(
				constants.LOCAL_CONNECTIONS,
				JSON.stringify({
					appNames: [],
					urls: [],
				}),
			);
		}
	}

	setSideBarVisibility = isShowingSideBar => {
		this.setState({
			isShowingSideBar,
		});
	};

	render() {
		const { isShowingSideBar } = this.state;
		return (
			<Provider store={store}>
				<BrowserRouter>
					<Layout css={{ minHeight: '100vh' }}>
						{isShowingSideBar && (
							<Sider theme="light">
								<img
									src={logo}
									alt="Dejavu"
									width="100%"
									css={{ padding: 25 }}
								/>
								<Navigation />
							</Sider>
						)}
						<Layout>
							<Content css={{ margin: 25 }}>
								<div
									css={{
										padding: 25,
										background: '#fff',
									}}
								>
									<Route exact path="/" component={Dejavu} />
									<Route
										path="/import"
										component={Importer}
									/>
									<Route
										path="/preview"
										component={SearchPreview}
									/>
									<Route
										path="/mappings"
										component={Mappings}
									/>
								</div>
							</Content>
						</Layout>
					</Layout>
				</BrowserRouter>
			</Provider>
		);
	}
}

export default App;