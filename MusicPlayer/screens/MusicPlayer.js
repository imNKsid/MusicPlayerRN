import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  SafeAreaView,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
  // Use the below code to produce the same results without Animation
  //   FlatList,
  Animated,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';

import TrackPlayer, {
  Capability,
  Event,
  RepeatMode,
  State,
  usePlaybackState,
  useProgress,
  useTrackPlayerEvents,
} from 'react-native-track-player';

import songs from '../model/data';
const {width, height} = Dimensions.get('window');

const setUpPlayer = async () => {
  try {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      // Media controls capabilities
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.Stop,
      ],
    });
    await TrackPlayer.add(songs);
    console.log();
  } catch (e) {
    console.log('Error =>', e);
  }
};

const togglePlayBack = async playBackState => {
  const currentTrack = await TrackPlayer.getCurrentTrack();
  await TrackPlayer.play();
  if (currentTrack !== null) {
    if (playBackState === State.Paused) {
      await TrackPlayer.play();
    } else {
      await TrackPlayer.pause();
    }
  }
};

const MusicPlayer = () => {
  const [songIndex, setSongIndex] = useState(0);
  const [trackTitle, setTrackTitle] = useState();
  const [trackArtist, setTrackArtist] = useState();
  const [trackImage, setTrackImage] = useState();
  const [repeatMode, setRepeatMode] = useState('off');
  const playBackState = usePlaybackState();
  const progress = useProgress();

  //Custom references
  const scrollX = useRef(new Animated.Value(0)).current;
  const songSlider = useRef(null); //Flatlist reference

  //Changing the track on complete
  useTrackPlayerEvents([Event.PlaybackTrackChanged], async event => {
    if (
      event.type === Event.PlaybackTrackChanged &&
      typeof event?.nextTrack !== 'undefined' &&
      Number.isInteger(event?.nextTrack) &&
      event.nextTrack !== null
    ) {
      const track = await TrackPlayer.getTrack(event.nextTrack);
      const {title, artist, artwork} = track;
      setTrackTitle(title);
      setTrackArtist(artist);
      setTrackImage(artwork);
    } else {
      Alert.alert('Music ends!', 'Do you want to play from beginning?', [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            TrackPlayer.setRepeatMode(RepeatMode.Queue);
            setRepeatMode('repeat');
          },
        },
      ]);
    }
  });

  const repeatIcon = () => {
    if (repeatMode === 'off') {
      return 'repeat-off';
    }
    if (repeatMode === 'track') {
      return 'repeat-once';
    }
    if (repeatMode === 'repeat') {
      return 'repeat';
    }
  };

  const changeRepeatMode = () => {
    if (repeatMode === 'off') {
      TrackPlayer.setRepeatMode(RepeatMode.Track);
      setRepeatMode('track');
    }
    if (repeatMode === 'track') {
      TrackPlayer.setRepeatMode(RepeatMode.Queue);
      setRepeatMode('repeat');
    }
    if (repeatMode === 'repeat') {
      TrackPlayer.setRepeatMode(RepeatMode.Off);
      setRepeatMode('off');
    }
  };

  const skipTo = async trackId => {
    await TrackPlayer.skip(trackId);
  };

  useEffect(() => {
    setUpPlayer();
    scrollX.addListener(({value}) => {
      const index = Math.round(value / width);
      setSongIndex(index);
      skipTo(index);
    });

    return () => {
      scrollX.removeAllListeners();
      // TrackPlayer.destroy();
    };
  }, []);

  const skipToNext = () => {
    songSlider.current.scrollToOffset({
      offset: (songIndex + 1) * width,
    });
  };

  const skipToPrev = () => {
    songSlider.current.scrollToOffset({
      offset: (songIndex - 1) * width,
    });
  };

  // With Animation effect
  const renderSongs = ({item, index}) => {
    return (
      <Animated.View style={[styles.mainImageWrapper]}>
        <View style={[styles.imageWrapper, styles.elevation]}>
          <Image source={trackImage} style={styles.musicImage} />
        </View>
      </Animated.View>
    );
  };

  // Use the below code to produce the same results without Animation
  //   const renderSongs = useCallback(({item, index}) => {
  //     return (
  //       <View style={[styles.mainImageWrapper]}>
  //         <View style={[styles.imageWrapper, styles.elevation]}>
  //           <Image source={item.artwork} style={styles.musicImage} />
  //         </View>
  //       </View>
  //     );
  //   }, []);

  //   const onViewableItemsChanged = useCallback(({viewableItems, changed}) => {
  //     setSongIndex(changed[0].index);
  //   }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContainer}>
        {/* image */}
        {/* With Animation effect */}
        <Animated.FlatList
          ref={songSlider}
          horizontal
          data={songs}
          renderItem={renderSongs}
          keyExtractor={item => item.id}
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [
              {
                nativeEvent: {
                  contentOffset: {x: scrollX},
                },
              },
            ],
            {useNativeDriver: true},
          )}
        />

        {/* Use the below code to produce the same results without Animation */}
        {/* <FlatList
          horizontal
          data={songs}
          renderItem={renderSongs}
          keyExtractor={item => item.id}
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{
            itemVisiblePercentThreshold: 100,
          }}
        /> */}

        {/* Song Content */}
        <View>
          <Text style={[styles.songContent, styles.songTitle]}>
            {trackTitle}
          </Text>
          <Text style={[styles.songContent, styles.songArtist]}>
            {trackArtist}
          </Text>
        </View>

        {/* slider */}
        <View>
          <Slider
            style={styles.progressBar}
            value={progress.position}
            minimumValue={0}
            maximumValue={progress.duration}
            thumbTintColor="#FFD369"
            minimumTrackTintColor="#FFD369"
            maximumTrackTintColor="#FFF"
            onSlidingComplete={async value => {
              await TrackPlayer.seekTo(value);
            }}
          />
        </View>

        {/* Music Progress Durations */}
        <View style={styles.progressLevelDuration}>
          <Text style={styles.progressLevelText}>
            {new Date(progress.position * 1000).toISOString().substring(14, 19)}
          </Text>
          <Text style={styles.progressLevelText}>
            {new Date(progress.duration * 1000).toISOString().substring(14, 19)}
          </Text>
        </View>

        {/* Music Controls */}
        <View style={styles.musicControlContainer}>
          <TouchableOpacity onPress={skipToPrev}>
            <Ionicons name="play-skip-back-outline" size={35} color="#FFD369" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => togglePlayBack(playBackState)}
            hitSlop={{top: 20, bottom: 20, left: 50, right: 50}}>
            <Ionicons
              name={
                playBackState === State.Playing
                  ? 'ios-pause-circle'
                  : 'ios-play-circle'
              }
              size={75}
              color="#FFD369"
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={skipToNext}>
            <Ionicons
              name="play-skip-forward-outline"
              size={35}
              color="#FFD369"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <View style={styles.bottomIconWrapper}>
          <TouchableOpacity onPress={() => {}}>
            <Ionicons name="heart-outline" size={30} color="#888888" />
          </TouchableOpacity>

          <TouchableOpacity onPress={changeRepeatMode}>
            <MaterialCommunityIcons
              name={`${repeatIcon()}`}
              size={30}
              color={repeatMode !== 'off' ? '#FFD369' : '#888888'}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {}}>
            <Ionicons name="share-outline" size={30} color="#888888" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {}}>
            <Ionicons name="ellipsis-horizontal" size={30} color="#888888" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222831',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImageWrapper: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: width * 0.8, //Platform.OS === 'ios' ? 320 : 300,
    height: height * 0.5, //Platform.OS === 'ios' ? 400 : 340,
    borderRadius: 25,
  },
  elevation: {
    elevation: 5,
    backgroundColor: '#222831',
    borderRadius: 25,
    shadowColor: '#ccc',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
  },
  musicImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  songContent: {
    textAlign: 'center',
    color: '#EEEEEE',
  },
  songTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  songArtist: {
    fontSize: 16,
    fontWeight: '300',
  },
  progressBar: {
    width: width * 0.89,
    right: 5,
    height: 40,
    marginTop: 15,
    flexDirection: 'row',
  },
  progressLevelDuration: {
    width: 340,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLevelText: {
    color: '#fff',
    fontWeight: '500',
  },
  musicControlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '60%',
    marginVertical: 15,
  },
  bottomContainer: {
    width: width,
    alignItems: 'center',
    paddingVertical: 15,
    borderTopColor: '#393E46',
    borderWidth: 1,
  },
  bottomIconWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
});
export default MusicPlayer;
