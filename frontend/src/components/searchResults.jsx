import { Grid, Button, ListItem, ListItemText, Avatar, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { Box } from '@mui/system';

const SearchResults = ({ users, showAll, onShowAllClick, onResultClick}) => {
  const renderUserResults = () => {
    return users.slice(0, showAll ? users.length : 5).map((user) => (
      <ListItem button 
      key={user._id} 
      component={Link}
      to={`/profile/${user._id}`}
      onClick={onResultClick}
>
        <Avatar src={user.photoURL} alt={user.displayName} sx={{ marginRight: 2, width: 40, height: 40 }} />
        <ListItemText primary={user.displayName} secondary={user.email} />
      </ListItem>
    ));
  };


  return (
    <Box>
<Grid container columns={{ xs: 4, md: 12 }}>
<Grid item>
        <Typography>User results:</Typography>
        {renderUserResults()}
        </Grid>
    </Grid>
    {(users.length > 5) && (
        <Button onClick={onShowAllClick} variant="outlined" sx={{ marginTop: 2 }}>
          {showAll ? 'Show Less Results' : 'Show All Results'}
        </Button>
      )}
      </Box>
  );
};

export default SearchResults;
